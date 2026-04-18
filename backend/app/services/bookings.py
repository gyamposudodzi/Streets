from datetime import timedelta

from fastapi import HTTPException, status

from app.domain.enums import BookingStatus, DisputeStatus
from app.models.entities import Booking, Dispute, User, utc_now
from app.repositories.sqlite import repository
from app.schemas.bookings import BookingCreateRequest
from app.schemas.disputes import DisputeCreateRequest


RELEASE_WINDOW = timedelta(hours=24)


def create_booking(payload: BookingCreateRequest, buyer: User) -> Booking:
    service = repository.get_service(payload.service_id)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )

    slot = None
    if payload.slot_id is not None:
        slot = repository.get_slot(payload.slot_id)
        if slot is None or slot.service_id != service.id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot is invalid for the selected service.",
            )
        if slot.is_reserved:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Slot is already reserved.",
            )
        slot = repository.reserve_slot(payload.slot_id)

    booking = Booking(
        buyer_id=buyer.id,
        creator_id=service.creator_id,
        service_id=service.id,
        slot_id=payload.slot_id,
        status=BookingStatus.DRAFT,
        scheduled_start=slot.starts_at if slot else None,
        scheduled_end=slot.ends_at if slot else None,
        fulfillment_type=service.fulfillment_type,
        release_at=(slot.ends_at + timedelta(hours=24)) if slot else None,
    )
    repository.create_booking(booking, actor_user_id=buyer.id)
    updated_booking = repository.mark_booking_pending_payment(booking.id, actor_user_id=buyer.id)
    return updated_booking


def accept_booking(booking_id: str, actor: User) -> Booking:
    booking = repository.get_booking(booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )
    if actor.role != "admin" and booking.creator_id != actor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the creator or an admin can accept this booking.",
        )
    if booking.status != BookingStatus.PAID_PENDING_ACCEPTANCE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only paid bookings pending acceptance can be accepted.",
        )

    updated = repository.update_booking_status(
        booking.id,
        BookingStatus.ACCEPTED,
        actor_user_id=actor.id,
        event_type="booking.accepted",
        detail="Creator accepted the booking.",
    )
    return updated


def cancel_booking(booking_id: str, actor: User) -> Booking:
    booking = repository.get_booking(booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )
    if actor.role != "admin" and actor.id not in {booking.buyer_id, booking.creator_id}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a booking participant or admin can cancel this booking.",
        )
    if booking.status in {
        BookingStatus.RELEASED,
        BookingStatus.REFUNDED,
        BookingStatus.CANCELLED,
        BookingStatus.DISPUTED,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking cannot be cancelled from its current state.",
        )

    updated = repository.update_booking_status(
        booking.id,
        BookingStatus.CANCELLED,
        actor_user_id=actor.id,
        event_type="booking.cancelled",
        detail="Booking was cancelled.",
    )
    return updated


def start_booking(booking_id: str, actor: User) -> Booking:
    booking = _get_booking_or_404(booking_id)
    _require_creator_or_admin(booking, actor, "start this booking")
    if booking.status != BookingStatus.ACCEPTED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only accepted bookings can be started.",
        )

    updated = repository.update_booking_status(
        booking.id,
        BookingStatus.IN_PROGRESS,
        actor_user_id=actor.id,
        event_type="booking.in_progress",
        detail="Service delivery was marked in progress.",
    )
    return updated


def deliver_booking(booking_id: str, actor: User) -> Booking:
    booking = _get_booking_or_404(booking_id)
    _require_creator_or_admin(booking, actor, "mark this booking delivered")
    if booking.status not in {BookingStatus.ACCEPTED, BookingStatus.IN_PROGRESS}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only accepted or in-progress bookings can be delivered.",
        )

    release_at = utc_now() + RELEASE_WINDOW
    updated = repository.update_booking_status(
        booking.id,
        BookingStatus.AWAITING_RELEASE,
        actor_user_id=actor.id,
        event_type="service.delivered",
        detail="Service was marked delivered and entered the release review window.",
        release_at=release_at,
    )
    return updated


def confirm_booking_completion(booking_id: str, actor: User) -> Booking:
    booking = _get_booking_or_404(booking_id)
    if actor.role != "admin" and booking.buyer_id != actor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the buyer or an admin can confirm completion.",
        )
    if booking.status != BookingStatus.AWAITING_RELEASE:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Only bookings awaiting release can be confirmed complete.",
        )

    updated = repository.update_booking_status(
        booking.id,
        BookingStatus.DELIVERED,
        actor_user_id=actor.id,
        event_type="service.completed",
        detail="Buyer confirmed completion. Held funds are ready for release.",
    )
    return updated


def open_booking_dispute(
    booking_id: str,
    payload: DisputeCreateRequest,
    actor: User,
) -> Dispute:
    booking = _get_booking_or_404(booking_id)
    if actor.role != "admin" and actor.id not in {booking.buyer_id, booking.creator_id}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only a booking participant or admin can open a dispute.",
        )
    if booking.status not in {
        BookingStatus.PAID_PENDING_ACCEPTANCE,
        BookingStatus.ACCEPTED,
        BookingStatus.IN_PROGRESS,
        BookingStatus.AWAITING_RELEASE,
        BookingStatus.DELIVERED,
    }:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking cannot be disputed from its current state.",
        )
    if any(
        dispute.status != DisputeStatus.RESOLVED
        for dispute in repository.list_disputes_for_booking(booking.id)
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This booking already has an open dispute.",
        )

    dispute = repository.create_dispute(
        Dispute(
            booking_id=booking.id,
            opened_by_user_id=actor.id,
            reason=payload.reason,
            details=payload.details,
        )
    )
    repository.update_booking_status(
        booking.id,
        BookingStatus.DISPUTED,
        actor_user_id=actor.id,
        event_type="dispute.opened",
        detail=f"Dispute opened: {payload.reason}",
    )
    return dispute


def _get_booking_or_404(booking_id: str) -> Booking:
    booking = repository.get_booking(booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )
    return booking


def _require_creator_or_admin(booking: Booking, actor: User, action: str) -> None:
    if actor.role != "admin" and booking.creator_id != actor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=f"Only the creator or an admin can {action}.",
        )

from datetime import timedelta

from fastapi import HTTPException, status

from app.domain.enums import BookingStatus
from app.models.entities import Booking, User
from app.repositories.sqlite import repository
from app.schemas.bookings import BookingCreateRequest


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

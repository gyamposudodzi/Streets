from datetime import timedelta

from app.core.config import settings
from app.domain.enums import AuditAction, BookingStatus, DisputeStatus
from app.models.entities import Booking, User, utc_now
from app.repositories.sqlite import repository
from app.services.audit import record_admin_action
from app.services.payments import release_held_funds_for_booking


def expire_unpaid_bookings(actor: User, now=None) -> list[Booking]:
    current_time = now or utc_now()
    cutoff = current_time - timedelta(minutes=settings.booking_hold_minutes)
    expired: list[Booking] = []

    for booking in repository.list_bookings():
        if booking.status != BookingStatus.PENDING_PAYMENT:
            continue
        if booking.created_at > cutoff:
            continue

        updated = repository.update_booking_status(
            booking.id,
            BookingStatus.CANCELLED,
            actor_user_id=actor.id,
            event_type="booking.expired",
            detail="Unpaid booking expired after the payment hold window.",
        )
        if booking.slot_id is not None:
            repository.release_slot(booking.slot_id)
        if updated is not None:
            expired.append(updated)
            record_admin_action(
                actor,
                AuditAction.BOOKING_EXPIRED,
                target_type="booking",
                target_id=booking.id,
                detail="Admin automation expired an unpaid booking.",
            )

    return expired


def auto_release_due_bookings(actor: User, now=None) -> list[Booking]:
    current_time = now or utc_now()
    released: list[Booking] = []

    for booking in repository.list_bookings():
        if booking.status not in {BookingStatus.AWAITING_RELEASE, BookingStatus.DELIVERED}:
            continue
        if booking.release_at is None or booking.release_at > current_time:
            continue
        if _has_open_dispute(booking.id):
            continue

        release_held_funds_for_booking(booking.id, actor)
        updated = repository.get_booking(booking.id)
        if updated is not None:
            released.append(updated)

    return released


def run_due_automation(actor: User, now=None) -> tuple[list[Booking], list[Booking]]:
    current_time = now or utc_now()
    expired = expire_unpaid_bookings(actor, current_time)
    released = auto_release_due_bookings(actor, current_time)
    return expired, released


def _has_open_dispute(booking_id: str) -> bool:
    return any(
        dispute.status != DisputeStatus.RESOLVED
        for dispute in repository.list_disputes_for_booking(booking_id)
    )

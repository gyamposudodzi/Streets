from uuid import uuid4

from fastapi import HTTPException, status

from app.domain.enums import BookingStatus, HeldFundsStatus, LedgerEntryType, PaymentStatus
from app.models.entities import HeldFunds, LedgerEntry, Payment, User
from app.repositories.sqlite import repository
from app.schemas.payments import PaymentIntentCreateRequest


PLATFORM_FEE_RATE = 0.2


def create_payment_intent(payload: PaymentIntentCreateRequest, actor: User) -> Payment:
    booking = repository.get_booking(payload.booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )
    if booking.buyer_id != actor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the booking buyer can create a payment intent.",
        )
    if booking.status != "pending_payment":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Booking is not awaiting payment.",
        )

    service = repository.get_service(booking.service_id)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )

    platform_fee = int(service.price * PLATFORM_FEE_RATE)
    creator_amount = service.price - platform_fee
    payment = Payment(
        booking_id=booking.id,
        provider=payload.provider,
        provider_payment_id=f"sim_{uuid4().hex}",
        gross_amount=service.price,
        platform_fee=platform_fee,
        creator_amount=creator_amount,
        currency=service.currency,
        status=PaymentStatus.REQUIRES_ACTION,
    )
    return repository.create_payment(payment)


def simulate_payment_success(payment_id: str, actor: User) -> tuple[Payment, HeldFunds]:
    payment = repository.get_payment(payment_id)
    if payment is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payment not found.",
        )

    booking = repository.get_booking(payment.booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )
    if booking.buyer_id != actor.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only the booking buyer can complete this payment.",
        )
    if payment.status != PaymentStatus.REQUIRES_ACTION:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payment is not awaiting action.",
        )

    updated_payment = repository.update_payment_status(payment.id, PaymentStatus.SUCCEEDED)
    held_funds = repository.create_held_funds(
        HeldFunds(
            booking_id=payment.booking_id,
            payment_id=payment.id,
            amount=payment.creator_amount,
            currency=payment.currency,
        )
    )

    repository.create_ledger_entry(
        LedgerEntry(
            account_type="buyer",
            account_id=booking.buyer_id,
            booking_id=booking.id,
            entry_type=LedgerEntryType.PAYMENT_CAPTURED,
            amount=payment.gross_amount,
            currency=payment.currency,
        )
    )
    repository.create_ledger_entry(
        LedgerEntry(
            account_type="platform",
            account_id="platform",
            booking_id=booking.id,
            entry_type=LedgerEntryType.PLATFORM_FEE,
            amount=payment.platform_fee,
            currency=payment.currency,
        )
    )
    repository.create_ledger_entry(
        LedgerEntry(
            account_type="creator",
            account_id=booking.creator_id,
            booking_id=booking.id,
            entry_type=LedgerEntryType.FUNDS_HELD,
            amount=payment.creator_amount,
            currency=payment.currency,
        )
    )
    repository.mark_booking_paid_pending_acceptance(booking.id, actor_user_id=actor.id)

    return updated_payment, held_funds


def release_held_funds_for_booking(booking_id: str, actor: User) -> list[HeldFunds]:
    booking = repository.get_booking(booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    held_funds = [
        held
        for held in repository.list_held_funds_for_booking(booking_id)
        if held.status == HeldFundsStatus.HELD
    ]
    if not held_funds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No held funds are available to release.",
        )

    released: list[HeldFunds] = []
    for held in held_funds:
        updated = repository.update_held_funds_status(held.id, HeldFundsStatus.RELEASED)
        if updated is None:
            continue
        repository.create_ledger_entry(
            LedgerEntry(
                account_type="creator",
                account_id=booking.creator_id,
                booking_id=booking.id,
                entry_type=LedgerEntryType.FUNDS_RELEASED,
                amount=held.amount,
                currency=held.currency,
            )
        )
        released.append(updated)

    repository.update_booking_status(
        booking.id,
        BookingStatus.RELEASED,
        actor_user_id=actor.id,
        event_type="release.executed",
        detail="Admin released held funds to creator balance.",
    )
    return released


def refund_held_funds_for_booking(booking_id: str, actor: User) -> list[HeldFunds]:
    booking = repository.get_booking(booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )

    held_funds = [
        held
        for held in repository.list_held_funds_for_booking(booking_id)
        if held.status == HeldFundsStatus.HELD
    ]
    if not held_funds:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No held funds are available to refund.",
        )

    refunded: list[HeldFunds] = []
    for held in held_funds:
        updated = repository.update_held_funds_status(held.id, HeldFundsStatus.REFUNDED)
        if updated is None:
            continue
        repository.create_ledger_entry(
            LedgerEntry(
                account_type="buyer",
                account_id=booking.buyer_id,
                booking_id=booking.id,
                entry_type=LedgerEntryType.REFUND_ISSUED,
                amount=held.amount,
                currency=held.currency,
            )
        )
        refunded.append(updated)

    repository.update_booking_status(
        booking.id,
        BookingStatus.REFUNDED,
        actor_user_id=actor.id,
        event_type="refund.issued",
        detail="Admin refunded held funds to buyer.",
    )
    return refunded

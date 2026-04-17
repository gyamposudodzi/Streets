from fastapi import APIRouter, Depends

from app.api.dependencies import require_current_user
from app.models.entities import User
from app.repositories.sqlite import repository
from app.schemas.payments import (
    BookingPaymentStateResponse,
    HeldFundsResponse,
    LedgerEntryResponse,
    PaymentIntentCreateRequest,
    PaymentIntentResponse,
    PaymentResponse,
)
from app.services.payments import create_payment_intent, simulate_payment_success


router = APIRouter()


@router.post("/create-intent", response_model=PaymentIntentResponse)
def create_intent(
    payload: PaymentIntentCreateRequest,
    actor: User = Depends(require_current_user),
) -> PaymentIntentResponse:
    payment = create_payment_intent(payload, actor)
    return PaymentIntentResponse(
        payment=PaymentResponse.model_validate(payment.model_dump()),
        checkout_reference=payment.provider_payment_id,
        message="Simulated payment intent created. Use simulate-success in development.",
    )


@router.post("/{payment_id}/simulate-success", response_model=PaymentResponse)
def simulate_success(
    payment_id: str,
    actor: User = Depends(require_current_user),
) -> PaymentResponse:
    payment, _ = simulate_payment_success(payment_id, actor)
    return PaymentResponse.model_validate(payment.model_dump())


@router.get("/bookings/{booking_id}", response_model=BookingPaymentStateResponse)
def booking_payment_state(booking_id: str) -> BookingPaymentStateResponse:
    payments = repository.list_payments_for_booking(booking_id)
    held_funds = repository.list_held_funds_for_booking(booking_id)
    ledger_entries = repository.list_ledger_entries_for_booking(booking_id)
    return BookingPaymentStateResponse(
        payments=[PaymentResponse.model_validate(payment.model_dump()) for payment in payments],
        held_funds=[
            HeldFundsResponse.model_validate(held.model_dump()) for held in held_funds
        ],
        ledger_entries=[
            LedgerEntryResponse.model_validate(entry.model_dump()) for entry in ledger_entries
        ],
    )

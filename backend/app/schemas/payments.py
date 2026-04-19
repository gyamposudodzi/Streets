from datetime import datetime

from pydantic import BaseModel

from app.domain.enums import (
    HeldFundsStatus,
    LedgerEntryType,
    PaymentStatus,
    PaymentWebhookEventStatus,
)


class PaymentIntentCreateRequest(BaseModel):
    booking_id: str
    provider: str = "simulated"


class PaymentResponse(BaseModel):
    id: str
    booking_id: str
    provider: str
    provider_payment_id: str
    gross_amount: int
    platform_fee: int
    creator_amount: int
    currency: str
    status: PaymentStatus
    created_at: datetime


class PaymentIntentResponse(BaseModel):
    payment: PaymentResponse
    checkout_reference: str
    message: str


class HeldFundsResponse(BaseModel):
    id: str
    booking_id: str
    payment_id: str
    amount: int
    currency: str
    status: HeldFundsStatus
    created_at: datetime


class PaymentWebhookEventResponse(BaseModel):
    id: str
    provider: str
    provider_event_id: str
    event_type: str
    payment_id: str | None
    payload: str
    status: PaymentWebhookEventStatus
    created_at: datetime
    processed_at: datetime | None


class LedgerEntryResponse(BaseModel):
    id: str
    account_type: str
    account_id: str
    booking_id: str
    entry_type: LedgerEntryType
    amount: int
    currency: str
    created_at: datetime


class BookingPaymentStateResponse(BaseModel):
    payments: list[PaymentResponse]
    held_funds: list[HeldFundsResponse]
    ledger_entries: list[LedgerEntryResponse]
    webhook_events: list[PaymentWebhookEventResponse] = []

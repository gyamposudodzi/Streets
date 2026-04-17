from datetime import datetime

from pydantic import BaseModel

from app.domain.enums import HeldFundsStatus, LedgerEntryType, PaymentStatus


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

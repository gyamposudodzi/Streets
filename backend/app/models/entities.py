from datetime import UTC, datetime, timedelta
from uuid import uuid4

from pydantic import BaseModel, Field

from app.domain.enums import (
    BookingStatus,
    FulfillmentType,
    HeldFundsStatus,
    LedgerEntryType,
    PaymentStatus,
    ReportStatus,
    ReportTargetType,
    UserRole,
    UserStatus,
    VerificationStatus,
)


def utc_now() -> datetime:
    return datetime.now(UTC)


class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    email: str
    phone: str | None = None
    role: UserRole = UserRole.USER
    status: UserStatus = UserStatus.ACTIVE
    is_age_verified: bool = False
    email_verified: bool = False
    created_at: datetime = Field(default_factory=utc_now)


class Session(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    user_id: str
    token: str
    created_at: datetime = Field(default_factory=utc_now)
    expires_at: datetime = Field(default_factory=lambda: utc_now() + timedelta(days=30))


class CreatorProfile(BaseModel):
    user_id: str
    display_name: str
    bio: str
    country: str
    service_region: str
    verification_status: VerificationStatus = VerificationStatus.PENDING
    payout_status: VerificationStatus = VerificationStatus.NOT_STARTED
    average_rating: float = 0.0
    created_at: datetime = Field(default_factory=utc_now)


class Service(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    creator_id: str
    title: str
    description: str
    category: str
    duration_minutes: int
    price: int
    currency: str = "USD"
    fulfillment_type: FulfillmentType
    is_active: bool = True
    created_at: datetime = Field(default_factory=utc_now)


class AvailabilitySlot(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    creator_id: str
    service_id: str
    starts_at: datetime
    ends_at: datetime
    is_reserved: bool = False


class Booking(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    buyer_id: str
    creator_id: str
    service_id: str
    slot_id: str | None = None
    status: BookingStatus = BookingStatus.DRAFT
    scheduled_start: datetime | None = None
    scheduled_end: datetime | None = None
    fulfillment_type: FulfillmentType
    release_at: datetime | None = None
    created_at: datetime = Field(default_factory=utc_now)


class BookingEvent(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    booking_id: str
    event_type: str
    actor_user_id: str
    detail: str
    created_at: datetime = Field(default_factory=utc_now)


class Payment(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    booking_id: str
    provider: str
    provider_payment_id: str
    gross_amount: int
    platform_fee: int
    creator_amount: int
    currency: str = "USD"
    status: PaymentStatus = PaymentStatus.REQUIRES_ACTION
    created_at: datetime = Field(default_factory=utc_now)


class HeldFunds(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    booking_id: str
    payment_id: str
    amount: int
    currency: str = "USD"
    status: HeldFundsStatus = HeldFundsStatus.HELD
    created_at: datetime = Field(default_factory=utc_now)


class LedgerEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    account_type: str
    account_id: str
    booking_id: str
    entry_type: LedgerEntryType
    amount: int
    currency: str = "USD"
    created_at: datetime = Field(default_factory=utc_now)


class Message(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    booking_id: str
    sender_id: str
    body: str
    created_at: datetime = Field(default_factory=utc_now)


class Report(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid4()))
    reporter_id: str
    target_type: ReportTargetType
    target_id: str
    reason: str
    details: str | None = None
    status: ReportStatus = ReportStatus.OPEN
    risk_score: int = 0
    created_at: datetime = Field(default_factory=utc_now)
    resolved_at: datetime | None = None

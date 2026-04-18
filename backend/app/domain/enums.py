from enum import StrEnum


class UserRole(StrEnum):
    USER = "user"
    CREATOR = "creator"
    ADMIN = "admin"


class UserStatus(StrEnum):
    PENDING = "pending"
    ACTIVE = "active"
    SUSPENDED = "suspended"


class VerificationStatus(StrEnum):
    NOT_STARTED = "not_started"
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class FulfillmentType(StrEnum):
    VIDEO = "video"
    AUDIO_CALL = "audio_call"
    CHAT = "chat"
    CUSTOM_REQUEST = "custom_request"
    IN_PERSON = "in_person"


class BookingStatus(StrEnum):
    DRAFT = "draft"
    PENDING_PAYMENT = "pending_payment"
    PAID_PENDING_ACCEPTANCE = "paid_pending_acceptance"
    ACCEPTED = "accepted"
    CANCELLED = "cancelled"
    RELEASED = "released"
    REFUNDED = "refunded"


class PaymentStatus(StrEnum):
    REQUIRES_ACTION = "requires_action"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    REFUNDED = "refunded"


class HeldFundsStatus(StrEnum):
    HELD = "held"
    RELEASED = "released"
    REFUNDED = "refunded"


class LedgerEntryType(StrEnum):
    PAYMENT_CAPTURED = "payment_captured"
    FUNDS_HELD = "funds_held"
    PLATFORM_FEE = "platform_fee"
    CREATOR_CREDIT = "creator_credit"
    FUNDS_RELEASED = "funds_released"
    REFUND_ISSUED = "refund_issued"


class ReportTargetType(StrEnum):
    USER = "user"
    CREATOR = "creator"
    SERVICE = "service"
    BOOKING = "booking"
    MESSAGE = "message"


class ReportStatus(StrEnum):
    OPEN = "open"
    REVIEWING = "reviewing"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

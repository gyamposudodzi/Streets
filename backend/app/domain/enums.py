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


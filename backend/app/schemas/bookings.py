from datetime import datetime

from pydantic import BaseModel

from app.domain.enums import BookingStatus, FulfillmentType


class BookingCreateRequest(BaseModel):
    buyer_id: str
    service_id: str
    slot_id: str | None = None


class BookingResponse(BaseModel):
    id: str
    buyer_id: str
    creator_id: str
    service_id: str
    slot_id: str | None
    status: BookingStatus
    scheduled_start: datetime | None
    scheduled_end: datetime | None
    fulfillment_type: FulfillmentType
    release_at: datetime | None
    created_at: datetime


class BookingEventResponse(BaseModel):
    id: str
    booking_id: str
    event_type: str
    actor_user_id: str
    detail: str
    created_at: datetime

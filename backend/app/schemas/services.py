from datetime import datetime

from pydantic import BaseModel

from app.domain.enums import FulfillmentType, ServiceModerationStatus


class ServiceResponse(BaseModel):
    id: str
    creator_id: str
    title: str
    description: str
    category: str
    duration_minutes: int
    price: int
    currency: str
    fulfillment_type: FulfillmentType
    is_active: bool
    moderation_status: ServiceModerationStatus
    created_at: datetime


class ServiceListQuery(BaseModel):
    q: str | None = None
    creator_id: str | None = None
    category: str | None = None
    fulfillment_type: FulfillmentType | None = None


class ServiceCreateRequest(BaseModel):
    title: str
    description: str
    category: str
    duration_minutes: int
    price: int
    currency: str = "USD"
    fulfillment_type: FulfillmentType


class ServiceUpdateRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    category: str | None = None
    duration_minutes: int | None = None
    price: int | None = None
    currency: str | None = None
    fulfillment_type: FulfillmentType | None = None
    is_active: bool | None = None
    moderation_status: ServiceModerationStatus | None = None

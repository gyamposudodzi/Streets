from datetime import datetime

from pydantic import BaseModel


class AvailabilitySlotCreateRequest(BaseModel):
    starts_at: datetime
    ends_at: datetime


class AvailabilitySlotResponse(BaseModel):
    id: str
    creator_id: str
    service_id: str
    starts_at: datetime
    ends_at: datetime
    is_reserved: bool

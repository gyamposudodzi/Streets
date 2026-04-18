from datetime import datetime

from pydantic import BaseModel

from app.domain.enums import DisputeResolution, DisputeStatus


class DisputeCreateRequest(BaseModel):
    reason: str
    details: str | None = None


class DisputeResolveRequest(BaseModel):
    resolution: DisputeResolution


class DisputeResponse(BaseModel):
    id: str
    booking_id: str
    opened_by_user_id: str
    status: DisputeStatus
    reason: str
    details: str | None
    resolution: DisputeResolution | None
    created_at: datetime
    resolved_at: datetime | None

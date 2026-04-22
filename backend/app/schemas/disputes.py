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


class DisputeEvidenceCreateRequest(BaseModel):
    evidence_type: str
    title: str
    description: str | None = None
    file_url: str | None = None
    is_admin_only: bool = False


class DisputeEvidenceResponse(BaseModel):
    id: str
    dispute_id: str
    submitted_by_user_id: str
    evidence_type: str
    title: str
    description: str | None
    file_url: str | None
    is_admin_only: bool
    created_at: datetime


class DisputeNoteCreateRequest(BaseModel):
    body: str
    is_internal: bool = False


class DisputeNoteResponse(BaseModel):
    id: str
    dispute_id: str
    author_user_id: str
    body: str
    is_internal: bool
    created_at: datetime

from datetime import datetime

from pydantic import BaseModel

from app.domain.enums import ReportStatus, ReportTargetType


class ReportCreateRequest(BaseModel):
    target_type: ReportTargetType
    target_id: str
    reason: str
    details: str | None = None


class ReportResolveRequest(BaseModel):
    status: ReportStatus


class ReportResponse(BaseModel):
    id: str
    reporter_id: str
    target_type: ReportTargetType
    target_id: str
    reason: str
    details: str | None
    status: ReportStatus
    risk_score: int
    created_at: datetime
    resolved_at: datetime | None

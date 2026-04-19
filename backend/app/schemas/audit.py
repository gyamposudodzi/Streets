from datetime import datetime

from pydantic import BaseModel

from app.domain.enums import AuditAction


class AuditLogResponse(BaseModel):
    id: str
    actor_user_id: str
    action: AuditAction
    target_type: str
    target_id: str
    detail: str
    created_at: datetime

from datetime import datetime

from pydantic import BaseModel


class ModerationRuleCreateRequest(BaseModel):
    pattern: str
    label: str
    action: str = "hold"
    is_active: bool = True


class ModerationRuleUpdateRequest(BaseModel):
    pattern: str | None = None
    label: str | None = None
    action: str | None = None
    is_active: bool | None = None


class ModerationRuleResponse(BaseModel):
    id: str
    pattern: str
    label: str
    action: str
    is_active: bool
    created_at: datetime

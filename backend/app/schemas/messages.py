from datetime import datetime

from pydantic import BaseModel


class MessageCreateRequest(BaseModel):
    body: str


class MessageResponse(BaseModel):
    id: str
    booking_id: str
    sender_id: str
    body: str
    created_at: datetime

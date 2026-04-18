from fastapi import APIRouter, Depends, status

from app.api.dependencies import require_current_user
from app.models.entities import User
from app.schemas.messages import MessageCreateRequest, MessageResponse
from app.services.messages import create_booking_message, list_booking_messages


router = APIRouter()


@router.get("/bookings/{booking_id}", response_model=list[MessageResponse])
def list_messages(
    booking_id: str,
    actor: User = Depends(require_current_user),
) -> list[MessageResponse]:
    messages = list_booking_messages(booking_id, actor)
    return [MessageResponse.model_validate(message.model_dump()) for message in messages]


@router.post(
    "/bookings/{booking_id}",
    response_model=MessageResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_message(
    booking_id: str,
    payload: MessageCreateRequest,
    actor: User = Depends(require_current_user),
) -> MessageResponse:
    message = create_booking_message(booking_id, payload, actor)
    return MessageResponse.model_validate(message.model_dump())

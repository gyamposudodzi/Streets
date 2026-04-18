from fastapi import HTTPException, status

from app.models.entities import Message, User
from app.repositories.sqlite import repository
from app.schemas.messages import MessageCreateRequest


def ensure_booking_message_access(booking_id: str, actor: User) -> None:
    booking = repository.get_booking(booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )
    if actor.role == "admin":
        return
    if actor.id not in {booking.buyer_id, booking.creator_id}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have access to this booking thread.",
        )


def list_booking_messages(booking_id: str, actor: User) -> list[Message]:
    ensure_booking_message_access(booking_id, actor)
    return repository.list_messages_for_booking(booking_id)


def create_booking_message(
    booking_id: str,
    payload: MessageCreateRequest,
    actor: User,
) -> Message:
    ensure_booking_message_access(booking_id, actor)
    body = payload.body.strip()
    if not body:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Message body is required.",
        )
    return repository.create_message(
        Message(
            booking_id=booking_id,
            sender_id=actor.id,
            body=body,
        )
    )

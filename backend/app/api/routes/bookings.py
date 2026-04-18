from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import require_current_user
from app.models.entities import User
from app.repositories.sqlite import repository
from app.schemas.bookings import BookingCreateRequest, BookingEventResponse, BookingResponse
from app.services.bookings import accept_booking, cancel_booking, create_booking


router = APIRouter()


@router.post("", response_model=BookingResponse, status_code=status.HTTP_201_CREATED)
def create_booking_route(
    payload: BookingCreateRequest,
    actor: User = Depends(require_current_user),
) -> BookingResponse:
    booking = create_booking(payload, buyer=actor)
    return BookingResponse.model_validate(booking.model_dump())


@router.get("/{booking_id}", response_model=BookingResponse)
def get_booking(booking_id: str) -> BookingResponse:
    booking = repository.get_booking(booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )
    return BookingResponse.model_validate(booking.model_dump())


@router.get("/{booking_id}/events", response_model=list[BookingEventResponse])
def list_booking_events(booking_id: str) -> list[BookingEventResponse]:
    booking = repository.get_booking(booking_id)
    if booking is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found.",
        )
    return [
        BookingEventResponse.model_validate(event.model_dump())
        for event in repository.list_booking_events(booking_id)
    ]


@router.post("/{booking_id}/accept", response_model=BookingResponse)
def accept_booking_route(
    booking_id: str,
    actor: User = Depends(require_current_user),
) -> BookingResponse:
    booking = accept_booking(booking_id, actor)
    return BookingResponse.model_validate(booking.model_dump())


@router.post("/{booking_id}/cancel", response_model=BookingResponse)
def cancel_booking_route(
    booking_id: str,
    actor: User = Depends(require_current_user),
) -> BookingResponse:
    booking = cancel_booking(booking_id, actor)
    return BookingResponse.model_validate(booking.model_dump())

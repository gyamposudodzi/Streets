from fastapi import HTTPException, status

from app.models.entities import AvailabilitySlot, Service
from app.repositories.sqlite import repository
from app.schemas.availability import AvailabilitySlotCreateRequest
from app.schemas.services import ServiceCreateRequest, ServiceUpdateRequest


def create_service(creator_id: str, payload: ServiceCreateRequest) -> Service:
    profile = repository.get_creator(creator_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator profile not found.",
        )

    service = Service(
        creator_id=creator_id,
        title=payload.title,
        description=payload.description,
        category=payload.category,
        duration_minutes=payload.duration_minutes,
        price=payload.price,
        currency=payload.currency,
        fulfillment_type=payload.fulfillment_type,
    )
    return repository.create_service(service)


def update_service(
    creator_id: str,
    service_id: str,
    payload: ServiceUpdateRequest,
) -> Service:
    service = repository.get_service(service_id)
    if service is None or service.creator_id != creator_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found for that creator.",
        )

    updated = repository.update_service(service_id, **payload.model_dump())
    return updated


def create_slot(
    creator_id: str,
    service_id: str,
    payload: AvailabilitySlotCreateRequest,
) -> AvailabilitySlot:
    service = repository.get_service(service_id)
    if service is None or service.creator_id != creator_id:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found for that creator.",
        )
    if payload.ends_at <= payload.starts_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slot end time must be after start time.",
        )

    slot = AvailabilitySlot(
        creator_id=creator_id,
        service_id=service_id,
        starts_at=payload.starts_at,
        ends_at=payload.ends_at,
    )
    return repository.create_slot(slot)

from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.api.dependencies import require_creator_owner_or_admin, require_current_user
from app.domain.enums import FulfillmentType
from app.models.entities import User
from app.repositories.sqlite import repository
from app.schemas.availability import AvailabilitySlotCreateRequest, AvailabilitySlotResponse
from app.schemas.services import ServiceCreateRequest, ServiceResponse, ServiceUpdateRequest
from app.services.services import create_service, create_slot, update_service


router = APIRouter()


@router.get("", response_model=list[ServiceResponse])
def list_services(
    q: str | None = Query(default=None),
    creator_id: str | None = Query(default=None),
    category: str | None = Query(default=None),
    fulfillment_type: FulfillmentType | None = Query(default=None),
) -> list[ServiceResponse]:
    services = repository.list_services(
        creator_id=creator_id,
        category=category,
        fulfillment_type=fulfillment_type,
        query=q,
        moderation_status=None if creator_id else "approved",
    )
    return [ServiceResponse.model_validate(service.model_dump()) for service in services]


@router.get("/{service_id}", response_model=ServiceResponse)
def get_service(service_id: str) -> ServiceResponse:
    service = repository.get_service(service_id)
    if service is None or service.moderation_status != "approved":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )
    return ServiceResponse.model_validate(service.model_dump())


@router.get("/{service_id}/slots", response_model=list[AvailabilitySlotResponse])
def list_service_slots(service_id: str) -> list[AvailabilitySlotResponse]:
    return [
        AvailabilitySlotResponse.model_validate(slot.model_dump())
        for slot in repository.list_slots_for_service(service_id)
    ]


@router.post("/creator/{creator_id}", response_model=ServiceResponse, status_code=status.HTTP_201_CREATED)
def create_service_route(
    creator_id: str,
    payload: ServiceCreateRequest,
    actor: User = Depends(require_current_user),
) -> ServiceResponse:
    require_creator_owner_or_admin(actor, creator_id)
    service = create_service(creator_id, payload)
    return ServiceResponse.model_validate(service.model_dump())


@router.patch("/creator/{creator_id}/{service_id}", response_model=ServiceResponse)
def update_service_route(
    creator_id: str,
    service_id: str,
    payload: ServiceUpdateRequest,
    actor: User = Depends(require_current_user),
) -> ServiceResponse:
    require_creator_owner_or_admin(actor, creator_id)
    service = update_service(creator_id, service_id, payload)
    return ServiceResponse.model_validate(service.model_dump())


@router.post(
    "/creator/{creator_id}/{service_id}/slots",
    response_model=AvailabilitySlotResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_service_slot_route(
    creator_id: str,
    service_id: str,
    payload: AvailabilitySlotCreateRequest,
    actor: User = Depends(require_current_user),
) -> AvailabilitySlotResponse:
    require_creator_owner_or_admin(actor, creator_id)
    slot = create_slot(creator_id, service_id, payload)
    return AvailabilitySlotResponse.model_validate(slot.model_dump())

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import require_creator_owner_or_admin, require_current_user
from app.models.entities import User
from app.repositories.sqlite import repository
from app.schemas.creators import (
    CreatorProfileResponse,
    CreatorSummaryResponse,
    UpsertCreatorProfileRequest,
)
from app.services.creators import upsert_creator_profile


router = APIRouter()


@router.get("", response_model=list[CreatorSummaryResponse])
def list_creators() -> list[CreatorSummaryResponse]:
    return [
        CreatorSummaryResponse.model_validate(profile.model_dump())
        for profile in repository.list_creators()
    ]


@router.get("/{creator_id}", response_model=CreatorProfileResponse)
def get_creator(creator_id: str) -> CreatorProfileResponse:
    profile = repository.get_creator(creator_id)
    if profile is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Creator not found.",
        )
    return CreatorProfileResponse.model_validate(profile.model_dump())


@router.put("/{creator_id}", response_model=CreatorProfileResponse)
def upsert_creator(
    creator_id: str,
    payload: UpsertCreatorProfileRequest,
    actor: User = Depends(require_current_user),
) -> CreatorProfileResponse:
    require_creator_owner_or_admin(actor, creator_id)
    profile = upsert_creator_profile(creator_id, payload)
    return CreatorProfileResponse.model_validate(profile.model_dump())

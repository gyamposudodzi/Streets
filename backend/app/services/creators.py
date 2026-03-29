from fastapi import HTTPException, status

from app.domain.enums import UserRole, VerificationStatus
from app.models.entities import CreatorProfile, utc_now
from app.repositories.sqlite import repository
from app.schemas.creators import UpsertCreatorProfileRequest


def upsert_creator_profile(user_id: str, payload: UpsertCreatorProfileRequest) -> CreatorProfile:
    user = repository.get_user(user_id)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    if user.role not in {UserRole.CREATOR, UserRole.ADMIN}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is not allowed to own a creator profile.",
        )

    existing = repository.get_creator(user_id)
    profile = CreatorProfile(
        user_id=user_id,
        display_name=payload.display_name,
        bio=payload.bio,
        country=payload.country,
        service_region=payload.service_region,
        verification_status=existing.verification_status if existing else VerificationStatus.PENDING,
        payout_status=existing.payout_status if existing else VerificationStatus.NOT_STARTED,
        average_rating=existing.average_rating if existing else 0.0,
        created_at=existing.created_at if existing else utc_now(),
    )
    return repository.upsert_creator_profile(profile)

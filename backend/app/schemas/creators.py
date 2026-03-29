from datetime import datetime

from pydantic import BaseModel

from app.domain.enums import VerificationStatus


class CreatorProfileResponse(BaseModel):
    user_id: str
    display_name: str
    bio: str
    country: str
    service_region: str
    verification_status: VerificationStatus
    payout_status: VerificationStatus
    average_rating: float
    created_at: datetime


class CreatorSummaryResponse(BaseModel):
    user_id: str
    display_name: str
    country: str
    service_region: str
    verification_status: VerificationStatus
    average_rating: float


class UpsertCreatorProfileRequest(BaseModel):
    display_name: str
    bio: str
    country: str
    service_region: str

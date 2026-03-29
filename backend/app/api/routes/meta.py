from app.core.config import settings
from app.schemas.meta import MetaResponse
from fastapi import APIRouter


router = APIRouter()


@router.get("/meta", response_model=MetaResponse)
def get_meta() -> MetaResponse:
    return MetaResponse(
        name=settings.app_name,
        phase="1",
        environment=settings.environment,
        status="foundation",
    )

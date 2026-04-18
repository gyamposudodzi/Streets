from fastapi import APIRouter, Depends, status

from app.api.dependencies import require_current_user
from app.models.entities import User
from app.schemas.reports import ReportCreateRequest, ReportResponse
from app.services.reports import create_report


router = APIRouter()


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
def create_report_route(
    payload: ReportCreateRequest,
    actor: User = Depends(require_current_user),
) -> ReportResponse:
    report = create_report(payload, actor)
    return ReportResponse.model_validate(report.model_dump())

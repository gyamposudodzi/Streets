from fastapi import HTTPException, status

from app.domain.enums import ReportStatus, ReportTargetType
from app.models.entities import Report, User, utc_now
from app.repositories.sqlite import repository
from app.schemas.reports import ReportCreateRequest, ReportResolveRequest


RISK_KEYWORDS = {
    "off platform",
    "cash",
    "wire",
    "escort",
    "prostitution",
    "illegal",
    "unsafe",
    "threat",
}


def calculate_risk_score(payload: ReportCreateRequest) -> int:
    combined = f"{payload.reason} {payload.details or ''}".lower()
    return min(
        100,
        sum(15 for keyword in RISK_KEYWORDS if keyword in combined),
    )


def validate_report_target(payload: ReportCreateRequest) -> None:
    if payload.target_type == ReportTargetType.USER and repository.get_user(payload.target_id):
        return
    if payload.target_type == ReportTargetType.CREATOR and repository.get_creator(payload.target_id):
        return
    if payload.target_type == ReportTargetType.SERVICE and repository.get_service(payload.target_id):
        return
    if payload.target_type == ReportTargetType.BOOKING and repository.get_booking(payload.target_id):
        return
    if payload.target_type == ReportTargetType.MESSAGE:
        # Message lookup is intentionally not exposed as a direct public primitive yet.
        return

    raise HTTPException(
        status_code=status.HTTP_404_NOT_FOUND,
        detail="Report target not found.",
    )


def create_report(payload: ReportCreateRequest, actor: User) -> Report:
    validate_report_target(payload)
    return repository.create_report(
        Report(
            reporter_id=actor.id,
            target_type=payload.target_type,
            target_id=payload.target_id,
            reason=payload.reason,
            details=payload.details,
            risk_score=calculate_risk_score(payload),
        )
    )


def resolve_report(report_id: str, payload: ReportResolveRequest) -> Report:
    report = repository.get_report(report_id)
    if report is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Report not found.",
        )
    if payload.status not in {ReportStatus.RESOLVED, ReportStatus.DISMISSED, ReportStatus.REVIEWING}:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Unsupported report status transition.",
        )
    resolved_at = utc_now().isoformat() if payload.status in {ReportStatus.RESOLVED, ReportStatus.DISMISSED} else None
    updated = repository.update_report_status(report_id, payload.status, resolved_at)
    return updated

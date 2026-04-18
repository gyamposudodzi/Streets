from datetime import UTC, datetime

from fastapi import APIRouter, Depends, HTTPException, status

from app.api.dependencies import require_admin_user
from app.models.entities import User
from app.repositories.sqlite import repository
from app.schemas.admin import AdminDashboardResponse, AdminOverviewResponse
from app.schemas.auth import UserResponse
from app.schemas.bookings import BookingResponse
from app.schemas.creators import CreatorSummaryResponse
from app.schemas.disputes import DisputeResolveRequest, DisputeResponse
from app.schemas.services import ServiceResponse
from app.schemas.payments import HeldFundsResponse
from app.schemas.reports import ReportResolveRequest, ReportResponse
from app.services.payments import release_held_funds_for_booking, refund_held_funds_for_booking
from app.services.reports import resolve_report


router = APIRouter()


@router.get("/overview", response_model=AdminOverviewResponse)
def admin_overview(_: User = Depends(require_admin_user)) -> AdminOverviewResponse:
    users = repository.list_users()
    creators = repository.list_creators()
    services = repository.list_services()
    bookings = repository.list_bookings()
    reports = repository.list_reports()
    disputes = repository.list_disputes()
    return AdminOverviewResponse(
        total_users=len(users),
        total_creators=len(creators),
        total_services=len(services),
        total_bookings=len(bookings),
        open_reports=len([report for report in reports if report.status == "open"]),
        open_disputes=len([dispute for dispute in disputes if dispute.status == "open"]),
    )


@router.get("/users", response_model=list[UserResponse])
def admin_users(_: User = Depends(require_admin_user)) -> list[UserResponse]:
    return [UserResponse.model_validate(user.model_dump()) for user in repository.list_users()]


@router.get("/creators", response_model=list[CreatorSummaryResponse])
def admin_creators(_: User = Depends(require_admin_user)) -> list[CreatorSummaryResponse]:
    return [
        CreatorSummaryResponse.model_validate(creator.model_dump())
        for creator in repository.list_creators()
    ]


@router.get("/services", response_model=list[ServiceResponse])
def admin_services(_: User = Depends(require_admin_user)) -> list[ServiceResponse]:
    return [
        ServiceResponse.model_validate(service.model_dump())
        for service in repository.list_services()
    ]


@router.post("/services/{service_id}/approve", response_model=ServiceResponse)
def admin_approve_service(
    service_id: str,
    _: User = Depends(require_admin_user),
) -> ServiceResponse:
    service = repository.update_service(service_id, moderation_status="approved", is_active=True)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )
    return ServiceResponse.model_validate(service.model_dump())


@router.post("/services/{service_id}/reject", response_model=ServiceResponse)
def admin_reject_service(
    service_id: str,
    _: User = Depends(require_admin_user),
) -> ServiceResponse:
    service = repository.update_service(service_id, moderation_status="rejected", is_active=False)
    if service is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found.",
        )
    return ServiceResponse.model_validate(service.model_dump())


@router.get("/bookings", response_model=list[BookingResponse])
def admin_bookings(_: User = Depends(require_admin_user)) -> list[BookingResponse]:
    return [
        BookingResponse.model_validate(booking.model_dump())
        for booking in repository.list_bookings()
    ]


@router.get("/reports", response_model=list[ReportResponse])
def admin_reports(_: User = Depends(require_admin_user)) -> list[ReportResponse]:
    return [
        ReportResponse.model_validate(report.model_dump())
        for report in repository.list_reports()
    ]


@router.get("/disputes", response_model=list[DisputeResponse])
def admin_disputes(_: User = Depends(require_admin_user)) -> list[DisputeResponse]:
    return [
        DisputeResponse.model_validate(dispute.model_dump())
        for dispute in repository.list_disputes()
    ]


@router.get("/creators/{creator_id}/bookings", response_model=list[BookingResponse])
def admin_creator_bookings(
    creator_id: str,
    _: User = Depends(require_admin_user),
) -> list[BookingResponse]:
    return [
        BookingResponse.model_validate(booking.model_dump())
        for booking in repository.list_bookings()
        if booking.creator_id == creator_id
    ]


@router.get("/dashboard", response_model=AdminDashboardResponse)
def admin_dashboard(_: User = Depends(require_admin_user)) -> AdminDashboardResponse:
    users = repository.list_users()
    creators = repository.list_creators()
    services = repository.list_services()
    bookings = repository.list_bookings()
    reports = repository.list_reports()
    disputes = repository.list_disputes()

    return AdminDashboardResponse(
        overview=AdminOverviewResponse(
            total_users=len(users),
            total_creators=len(creators),
            total_services=len(services),
            total_bookings=len(bookings),
            open_reports=len([report for report in reports if report.status == "open"]),
            open_disputes=len([dispute for dispute in disputes if dispute.status == "open"]),
        ),
        users=[UserResponse.model_validate(user.model_dump()) for user in users],
        creators=[
            CreatorSummaryResponse.model_validate(creator.model_dump()) for creator in creators
        ],
        services=[
            ServiceResponse.model_validate(service.model_dump()) for service in services
        ],
        bookings=[
            BookingResponse.model_validate(booking.model_dump()) for booking in bookings
        ],
        reports=[
            ReportResponse.model_validate(report.model_dump()) for report in reports
        ],
        disputes=[
            DisputeResponse.model_validate(dispute.model_dump()) for dispute in disputes
        ],
    )


@router.post("/reports/{report_id}/resolve", response_model=ReportResponse)
def admin_resolve_report(
    report_id: str,
    payload: ReportResolveRequest,
    _: User = Depends(require_admin_user),
) -> ReportResponse:
    report = resolve_report(report_id, payload)
    return ReportResponse.model_validate(report.model_dump())


@router.post("/disputes/{dispute_id}/resolve", response_model=DisputeResponse)
def admin_resolve_dispute(
    dispute_id: str,
    payload: DisputeResolveRequest,
    actor: User = Depends(require_admin_user),
) -> DisputeResponse:
    dispute = repository.get_dispute(dispute_id)
    if dispute is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispute not found.",
        )

    if payload.resolution == "release":
        release_held_funds_for_booking(dispute.booking_id, actor)
    else:
        refund_held_funds_for_booking(dispute.booking_id, actor)

    resolved = repository.update_dispute_status(
        dispute.id,
        status="resolved",
        resolution=payload.resolution,
        resolved_at=datetime.now(UTC).isoformat(),
    )
    return DisputeResponse.model_validate(resolved.model_dump())


@router.post("/bookings/{booking_id}/release", response_model=list[HeldFundsResponse])
def admin_release_booking(
    booking_id: str,
    actor: User = Depends(require_admin_user),
) -> list[HeldFundsResponse]:
    held_funds = release_held_funds_for_booking(booking_id, actor)
    return [HeldFundsResponse.model_validate(held.model_dump()) for held in held_funds]


@router.post("/bookings/{booking_id}/refund", response_model=list[HeldFundsResponse])
def admin_refund_booking(
    booking_id: str,
    actor: User = Depends(require_admin_user),
) -> list[HeldFundsResponse]:
    held_funds = refund_held_funds_for_booking(booking_id, actor)
    return [HeldFundsResponse.model_validate(held.model_dump()) for held in held_funds]

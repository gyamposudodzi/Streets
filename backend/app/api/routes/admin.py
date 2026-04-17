from fastapi import APIRouter, Depends

from app.api.dependencies import require_admin_user
from app.models.entities import User
from app.repositories.sqlite import repository
from app.schemas.admin import AdminDashboardResponse, AdminOverviewResponse
from app.schemas.auth import UserResponse
from app.schemas.bookings import BookingResponse
from app.schemas.creators import CreatorSummaryResponse
from app.schemas.services import ServiceResponse


router = APIRouter()


@router.get("/overview", response_model=AdminOverviewResponse)
def admin_overview(_: User = Depends(require_admin_user)) -> AdminOverviewResponse:
    users = repository.list_users()
    creators = repository.list_creators()
    services = repository.list_services()
    bookings = repository.list_bookings()
    return AdminOverviewResponse(
        total_users=len(users),
        total_creators=len(creators),
        total_services=len(services),
        total_bookings=len(bookings),
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


@router.get("/bookings", response_model=list[BookingResponse])
def admin_bookings(_: User = Depends(require_admin_user)) -> list[BookingResponse]:
    return [
        BookingResponse.model_validate(booking.model_dump())
        for booking in repository.list_bookings()
    ]


@router.get("/dashboard", response_model=AdminDashboardResponse)
def admin_dashboard(_: User = Depends(require_admin_user)) -> AdminDashboardResponse:
    users = repository.list_users()
    creators = repository.list_creators()
    services = repository.list_services()
    bookings = repository.list_bookings()

    return AdminDashboardResponse(
        overview=AdminOverviewResponse(
            total_users=len(users),
            total_creators=len(creators),
            total_services=len(services),
            total_bookings=len(bookings),
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
    )

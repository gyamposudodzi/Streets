from pydantic import BaseModel

from app.schemas.auth import UserResponse
from app.schemas.bookings import BookingResponse
from app.schemas.creators import CreatorSummaryResponse
from app.schemas.disputes import DisputeResponse
from app.schemas.reports import ReportResponse
from app.schemas.services import ServiceResponse


class AdminOverviewResponse(BaseModel):
    total_users: int
    total_creators: int
    total_services: int
    total_bookings: int
    open_reports: int = 0
    open_disputes: int = 0


class AdminDashboardResponse(BaseModel):
    overview: AdminOverviewResponse
    users: list[UserResponse]
    creators: list[CreatorSummaryResponse]
    services: list[ServiceResponse]
    bookings: list[BookingResponse]
    reports: list[ReportResponse]
    disputes: list[DisputeResponse]

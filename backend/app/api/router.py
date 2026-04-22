from fastapi import APIRouter

from app.api.routes import admin, auth, bookings, creators, disputes, messages, meta, payments, reports, services


api_router = APIRouter()
api_router.include_router(meta.router, tags=["meta"])
api_router.include_router(auth.router, prefix="/auth", tags=["auth"])
api_router.include_router(creators.router, prefix="/creators", tags=["creators"])
api_router.include_router(services.router, prefix="/services", tags=["services"])
api_router.include_router(bookings.router, prefix="/bookings", tags=["bookings"])
api_router.include_router(payments.router, prefix="/payments", tags=["payments"])
api_router.include_router(messages.router, prefix="/messages", tags=["messages"])
api_router.include_router(reports.router, prefix="/reports", tags=["reports"])
api_router.include_router(disputes.router, prefix="/disputes", tags=["disputes"])
api_router.include_router(admin.router, prefix="/admin", tags=["admin"])

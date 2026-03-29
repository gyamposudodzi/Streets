from fastapi import APIRouter, Depends

from app.api.dependencies import require_current_user
from app.models.entities import User
from app.schemas.auth import AuthSessionResponse, LoginRequest, RegisterRequest, UserResponse
from app.services.auth import get_current_user, login_user, register_user


router = APIRouter()


@router.post("/register", response_model=UserResponse)
def register(payload: RegisterRequest) -> UserResponse:
    user = register_user(payload)
    return UserResponse.model_validate(user.model_dump())


@router.post("/login", response_model=AuthSessionResponse)
def login(payload: LoginRequest) -> AuthSessionResponse:
    session = login_user(payload)
    user = get_current_user(session.token)
    return AuthSessionResponse(
        access_token=session.token,
        user=UserResponse.model_validate(user.model_dump()),
    )


@router.get("/me", response_model=UserResponse)
def me(user: User = Depends(require_current_user)) -> UserResponse:
    return UserResponse.model_validate(user.model_dump())

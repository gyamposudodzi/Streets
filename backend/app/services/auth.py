from secrets import token_urlsafe

from fastapi import HTTPException, status

from app.models.entities import Session, User
from app.repositories.sqlite import repository
from app.schemas.auth import LoginRequest, RegisterRequest


def register_user(payload: RegisterRequest) -> User:
    existing = repository.get_user_by_email(payload.email)
    if existing is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with that email already exists.",
        )

    user = User(
        email=payload.email,
        phone=payload.phone,
        role=payload.role,
        is_age_verified=payload.is_age_verified,
        email_verified=False,
    )
    return repository.create_user(user)


def login_user(payload: LoginRequest) -> Session:
    user = repository.get_user_by_email(payload.email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No user found for that email.",
        )

    session = Session(user_id=user.id, token=token_urlsafe(24))
    return repository.create_session(session)


def get_current_user(access_token: str) -> User:
    user = repository.get_user_by_token(access_token)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired access token.",
        )
    return user

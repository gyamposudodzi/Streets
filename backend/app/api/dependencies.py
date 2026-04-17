from fastapi import Depends, Header, HTTPException, status

from app.domain.enums import UserRole
from app.models.entities import User
from app.services.auth import get_current_user


def require_current_user(authorization: str | None = Header(default=None)) -> User:
    if authorization is None or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authorization header is required.",
        )
    return get_current_user(authorization.removeprefix("Bearer ").strip())


def require_creator_owner_or_admin(actor: User, creator_id: str) -> None:
    if actor.role == UserRole.ADMIN:
        return
    if actor.role != UserRole.CREATOR or actor.id != creator_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You do not have permission to manage this creator resource.",
        )


def require_admin_user(actor: User = Depends(require_current_user)) -> User:
    if actor.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access is required.",
        )
    return actor

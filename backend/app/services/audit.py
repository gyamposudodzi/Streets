from app.domain.enums import AuditAction
from app.models.entities import AuditLog, User
from app.repositories.sqlite import repository


def record_admin_action(
    actor: User,
    action: AuditAction,
    target_type: str,
    target_id: str,
    detail: str,
) -> AuditLog | None:
    if actor.role != "admin":
        return None

    return repository.create_audit_log(
        AuditLog(
            actor_user_id=actor.id,
            action=action,
            target_type=target_type,
            target_id=target_id,
            detail=detail,
        )
    )

from fastapi import HTTPException, status

from app.domain.enums import UserRole
from app.models.entities import Dispute, DisputeEvidence, DisputeNote, User
from app.repositories.sqlite import repository
from app.schemas.disputes import DisputeEvidenceCreateRequest, DisputeNoteCreateRequest


def list_dispute_evidence(dispute_id: str, actor: User) -> list[DisputeEvidence]:
    dispute = _get_dispute_or_404(dispute_id)
    _require_dispute_access(dispute, actor)
    evidence = repository.list_dispute_evidence(dispute.id)
    if actor.role == UserRole.ADMIN:
        return evidence
    return [item for item in evidence if not item.is_admin_only]


def create_dispute_evidence(
    dispute_id: str,
    payload: DisputeEvidenceCreateRequest,
    actor: User,
) -> DisputeEvidence:
    dispute = _get_dispute_or_404(dispute_id)
    _require_dispute_access(dispute, actor)
    if payload.is_admin_only and actor.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create admin-only dispute evidence.",
        )

    return repository.create_dispute_evidence(
        DisputeEvidence(
            dispute_id=dispute.id,
            submitted_by_user_id=actor.id,
            evidence_type=payload.evidence_type,
            title=payload.title,
            description=payload.description,
            file_url=payload.file_url,
            is_admin_only=payload.is_admin_only,
        )
    )


def list_dispute_notes(dispute_id: str, actor: User) -> list[DisputeNote]:
    dispute = _get_dispute_or_404(dispute_id)
    _require_dispute_access(dispute, actor)
    notes = repository.list_dispute_notes(dispute.id)
    if actor.role == UserRole.ADMIN:
        return notes
    return [note for note in notes if not note.is_internal]


def create_dispute_note(
    dispute_id: str,
    payload: DisputeNoteCreateRequest,
    actor: User,
) -> DisputeNote:
    dispute = _get_dispute_or_404(dispute_id)
    _require_dispute_access(dispute, actor)
    if payload.is_internal and actor.role != UserRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create internal dispute notes.",
        )

    return repository.create_dispute_note(
        DisputeNote(
            dispute_id=dispute.id,
            author_user_id=actor.id,
            body=payload.body,
            is_internal=payload.is_internal,
        )
    )


def _get_dispute_or_404(dispute_id: str) -> Dispute:
    dispute = repository.get_dispute(dispute_id)
    if dispute is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Dispute not found.",
        )
    return dispute


def _require_dispute_access(dispute: Dispute, actor: User) -> None:
    if actor.role == UserRole.ADMIN:
        return

    booking = repository.get_booking(dispute.booking_id)
    if booking is None or actor.id not in {booking.buyer_id, booking.creator_id}:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only dispute participants or admins can access this dispute.",
        )

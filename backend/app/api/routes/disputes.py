from fastapi import APIRouter, Depends, status

from app.api.dependencies import require_current_user
from app.models.entities import User
from app.schemas.disputes import (
    DisputeEvidenceCreateRequest,
    DisputeEvidenceResponse,
    DisputeNoteCreateRequest,
    DisputeNoteResponse,
)
from app.services.disputes import (
    create_dispute_evidence,
    create_dispute_note,
    list_dispute_evidence,
    list_dispute_notes,
)


router = APIRouter()


@router.get("/{dispute_id}/evidence", response_model=list[DisputeEvidenceResponse])
def list_evidence_route(
    dispute_id: str,
    actor: User = Depends(require_current_user),
) -> list[DisputeEvidenceResponse]:
    return [
        DisputeEvidenceResponse.model_validate(evidence.model_dump())
        for evidence in list_dispute_evidence(dispute_id, actor)
    ]


@router.post(
    "/{dispute_id}/evidence",
    response_model=DisputeEvidenceResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_evidence_route(
    dispute_id: str,
    payload: DisputeEvidenceCreateRequest,
    actor: User = Depends(require_current_user),
) -> DisputeEvidenceResponse:
    evidence = create_dispute_evidence(dispute_id, payload, actor)
    return DisputeEvidenceResponse.model_validate(evidence.model_dump())


@router.get("/{dispute_id}/notes", response_model=list[DisputeNoteResponse])
def list_notes_route(
    dispute_id: str,
    actor: User = Depends(require_current_user),
) -> list[DisputeNoteResponse]:
    return [
        DisputeNoteResponse.model_validate(note.model_dump())
        for note in list_dispute_notes(dispute_id, actor)
    ]


@router.post(
    "/{dispute_id}/notes",
    response_model=DisputeNoteResponse,
    status_code=status.HTTP_201_CREATED,
)
def create_note_route(
    dispute_id: str,
    payload: DisputeNoteCreateRequest,
    actor: User = Depends(require_current_user),
) -> DisputeNoteResponse:
    note = create_dispute_note(dispute_id, payload, actor)
    return DisputeNoteResponse.model_validate(note.model_dump())

from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from cms_api.database import get_session
from cms_api.metadata_workflow import generate_candidate, update_candidate
from cms_api.schemas import GenerateMetadataRequest, MetadataResponse, MetadataUpdate

router = APIRouter(prefix="/api/draft", tags=["metadata"])


@router.post("/generate", response_model=MetadataResponse)
def generate_draft_metadata(
    payload: GenerateMetadataRequest,
    session: Session = Depends(get_session),
) -> MetadataResponse:
    return generate_candidate(session, payload)


@router.put("/metadata", response_model=MetadataResponse)
def update_draft_metadata(
    payload: MetadataUpdate,
    session: Session = Depends(get_session),
) -> MetadataResponse:
    return update_candidate(session, payload)

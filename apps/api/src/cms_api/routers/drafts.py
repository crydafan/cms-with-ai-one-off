from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from cms_api.database import get_session
from cms_api.drafts import get_or_create_draft, update_draft
from cms_api.schemas import DraftResponse, DraftUpdate

router = APIRouter(prefix="/api/draft", tags=["drafts"])


@router.get("", response_model=DraftResponse)
def read_draft(session: Session = Depends(get_session)) -> DraftResponse:
    draft = get_or_create_draft(session)
    session.commit()
    return DraftResponse.model_validate(draft)


@router.put("", response_model=DraftResponse)
def write_draft(payload: DraftUpdate, session: Session = Depends(get_session)) -> DraftResponse:
    draft = update_draft(session, payload.title, payload.body_markdown)
    session.commit()
    session.refresh(draft)
    return DraftResponse.model_validate(draft)

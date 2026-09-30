from sqlalchemy.orm import Session

from cms_api.database import utc_now
from cms_api.models import Draft


def clear_candidate(draft: Draft) -> None:
    draft.candidate_slug = None
    draft.candidate_category = None
    draft.candidate_tags = None
    draft.candidate_summary = None
    draft.candidate_source_hash = None


def get_or_create_draft(session: Session) -> Draft:
    draft = session.get(Draft, 1)
    if draft is None:
        draft = Draft(id=1, title="", body_markdown="", updated_at=utc_now())
        session.add(draft)
        session.flush()
    return draft


def update_draft(session: Session, title: str, body_markdown: str) -> Draft:
    draft = get_or_create_draft(session)
    if draft.title != title or draft.body_markdown != body_markdown:
        draft.title = title
        draft.body_markdown = body_markdown
        draft.updated_at = utc_now()
        clear_candidate(draft)
        session.flush()
    return draft


def reset_draft(session: Session) -> Draft:
    draft = get_or_create_draft(session)
    draft.title = ""
    draft.body_markdown = ""
    draft.updated_at = utc_now()
    clear_candidate(draft)
    session.flush()
    return draft

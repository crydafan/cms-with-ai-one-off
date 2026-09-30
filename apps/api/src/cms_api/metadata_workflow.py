from sqlalchemy.orm import Session

from cms_api.content_hash import candidate_source_hash
from cms_api.database import utc_now
from cms_api.drafts import clear_candidate, get_or_create_draft, update_draft
from cms_api.errors import ApiError
from cms_api.metadata_generation import MetadataGenerationError, generate_metadata
from cms_api.schemas import GenerateMetadataRequest, MetadataResponse, MetadataUpdate


def generate_candidate(session: Session, request: GenerateMetadataRequest) -> MetadataResponse:
    draft = update_draft(session, request.title, request.body_markdown)
    clear_candidate(draft)
    draft.updated_at = utc_now()
    session.commit()

    try:
        metadata = generate_metadata(request.title, request.body_markdown)
    except MetadataGenerationError as error:
        raise ApiError(
            status_code=503,
            code="metadata_generation_failed",
            message="Metadata generation failed. Your draft is saved; please retry.",
        ) from error

    draft = get_or_create_draft(session)
    draft.candidate_slug = metadata.slug
    draft.candidate_category = metadata.category
    draft.candidate_tags = metadata.tags
    draft.candidate_summary = metadata.summary
    draft.candidate_source_hash = candidate_source_hash(request.title, request.body_markdown)
    draft.updated_at = utc_now()
    session.commit()
    session.refresh(draft)
    return metadata


def update_candidate(session: Session, metadata: MetadataUpdate) -> MetadataResponse:
    draft = get_or_create_draft(session)
    current_hash = candidate_source_hash(draft.title, draft.body_markdown)
    if (
        draft.candidate_source_hash is None
        or draft.candidate_source_hash != current_hash
        or draft.candidate_slug is None
        or draft.candidate_category is None
        or draft.candidate_tags is None
        or draft.candidate_summary is None
    ):
        raise ApiError(409, "candidate_missing", "Generate a metadata preview before editing it.")

    draft.candidate_slug = metadata.slug
    draft.candidate_category = metadata.category
    draft.candidate_tags = metadata.tags
    draft.candidate_summary = metadata.summary
    draft.updated_at = utc_now()
    session.commit()
    session.refresh(draft)
    return MetadataResponse(**metadata.model_dump())

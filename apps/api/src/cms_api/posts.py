from sqlalchemy import desc, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from cms_api.content_hash import candidate_source_hash
from cms_api.database import utc_now
from cms_api.drafts import get_or_create_draft, reset_draft
from cms_api.errors import ApiError
from cms_api.models import PublishedPost
from cms_api.schemas import PostDetail, PostListItem, PublishPostRequest


def publish_post(session: Session, request: PublishPostRequest) -> PostDetail:
    draft = get_or_create_draft(session)
    submitted_hash = candidate_source_hash(request.title, request.body_markdown)

    if draft.candidate_source_hash is None:
        raise ApiError(409, "candidate_missing", "Generate and save a metadata review before publishing.")

    if draft.candidate_source_hash != submitted_hash:
        raise ApiError(409, "candidate_source_mismatch", "The article changed after metadata was generated.")

    submitted_metadata = (request.slug, request.category, request.tags, request.summary)
    saved_metadata = (
        draft.candidate_slug,
        draft.candidate_category,
        draft.candidate_tags,
        draft.candidate_summary,
    )
    if any(value is None for value in saved_metadata) or saved_metadata != submitted_metadata:
        raise ApiError(409, "candidate_missing", "Save the latest metadata review before publishing.")

    existing_post = session.scalar(select(PublishedPost.id).where(PublishedPost.slug == request.slug))
    if existing_post is not None:
        raise ApiError(409, "slug_taken", "That slug is already used by a published post.", field="slug")

    post = PublishedPost(
        title=request.title,
        body_markdown=request.body_markdown,
        slug=request.slug,
        category=request.category,
        tags=request.tags,
        summary=request.summary,
        published_at=utc_now(),
    )
    session.add(post)

    try:
        reset_draft(session)
        session.commit()
    except IntegrityError as error:
        session.rollback()
        existing_post = session.scalar(select(PublishedPost.id).where(PublishedPost.slug == request.slug))
        if existing_post is not None:
            raise ApiError(409, "slug_taken", "That slug is already used by a published post.", field="slug") from error
        raise

    session.refresh(post)
    return PostDetail.model_validate(post)


def list_published_posts(session: Session) -> list[PostListItem]:
    posts = session.scalars(
        select(PublishedPost).order_by(desc(PublishedPost.published_at), desc(PublishedPost.id))
    ).all()
    return [PostListItem.model_validate(post) for post in posts]


def get_published_post(session: Session, slug: str) -> PostDetail:
    post = session.scalar(select(PublishedPost).where(PublishedPost.slug == slug))
    if post is None:
        raise ApiError(404, "post_not_found", "No published post has that slug.")
    return PostDetail.model_validate(post)

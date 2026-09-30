from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session

from cms_api.database import get_session
from cms_api.posts import get_published_post, list_published_posts, publish_post
from cms_api.schemas import PostDetail, PostListItem, PublishPostRequest

router = APIRouter(prefix="/api", tags=["posts"])


@router.post("/draft/publish", response_model=PostDetail, status_code=status.HTTP_201_CREATED)
def publish_draft(payload: PublishPostRequest, session: Session = Depends(get_session)) -> PostDetail:
    return publish_post(session, payload)


@router.get("/posts", response_model=list[PostListItem])
def read_posts(session: Session = Depends(get_session)) -> list[PostListItem]:
    return list_published_posts(session)


@router.get("/posts/{slug}", response_model=PostDetail)
def read_post(slug: str, session: Session = Depends(get_session)) -> PostDetail:
    return get_published_post(session, slug)

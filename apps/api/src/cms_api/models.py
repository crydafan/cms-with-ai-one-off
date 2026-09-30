from datetime import datetime

from sqlalchemy import CheckConstraint, JSON, Index, Integer, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from cms_api.database import Base, UTCDateTime, utc_now


class Draft(Base):
    __tablename__ = "drafts"
    __table_args__ = (CheckConstraint("id = 1", name="ck_drafts_singleton_id"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, default=1)
    title: Mapped[str] = mapped_column(Text, nullable=False, default="")
    body_markdown: Mapped[str] = mapped_column(Text, nullable=False, default="")
    updated_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now, onupdate=utc_now)
    candidate_slug: Mapped[str | None] = mapped_column(String(200), nullable=True)
    candidate_category: Mapped[str | None] = mapped_column(Text, nullable=True)
    candidate_tags: Mapped[list[str] | None] = mapped_column(JSON, nullable=True)
    candidate_summary: Mapped[str | None] = mapped_column(Text, nullable=True)
    candidate_source_hash: Mapped[str | None] = mapped_column(String(64), nullable=True)


class PublishedPost(Base):
    __tablename__ = "published_posts"
    __table_args__ = (
        UniqueConstraint("slug", name="uq_published_posts_slug"),
        Index("ix_published_posts_published_at_id", "published_at", "id"),
    )

    id: Mapped[int] = mapped_column(Integer, primary_key=True, autoincrement=True)
    title: Mapped[str] = mapped_column(Text, nullable=False)
    body_markdown: Mapped[str] = mapped_column(Text, nullable=False)
    slug: Mapped[str] = mapped_column(String(200), nullable=False)
    category: Mapped[str] = mapped_column(Text, nullable=False)
    tags: Mapped[list[str]] = mapped_column(JSON, nullable=False, default=list)
    summary: Mapped[str] = mapped_column(Text, nullable=False)
    published_at: Mapped[datetime] = mapped_column(UTCDateTime(), nullable=False, default=utc_now)

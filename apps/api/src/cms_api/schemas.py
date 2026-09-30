from datetime import datetime
from typing import Annotated

from pydantic import AfterValidator, BaseModel, ConfigDict, Field, StringConstraints, field_validator

MAX_TAGS = 5
Slug = Annotated[str, StringConstraints(min_length=1, max_length=200, pattern=r"^[a-z0-9]+(?:-[a-z0-9]+)*$")]


def _require_nonblank(value: str) -> str:
    if not value.strip():
        raise ValueError("Value must not be blank.")
    return value


NonBlankText = Annotated[str, StringConstraints(min_length=1), AfterValidator(_require_nonblank)]


class MetadataFields(BaseModel):
    model_config = ConfigDict(extra="forbid")

    slug: Slug
    category: NonBlankText
    tags: list[NonBlankText] = Field(max_length=MAX_TAGS)
    summary: NonBlankText

    @field_validator("tags")
    @classmethod
    def tags_must_be_unique(cls, tags: list[str]) -> list[str]:
        normalized = [tag.casefold() for tag in tags]
        if len(normalized) != len(set(normalized)):
            raise ValueError("Tags must be unique.")
        return tags


class DraftUpdate(BaseModel):
    title: str = Field(max_length=500)
    body_markdown: str


class GenerateMetadataRequest(BaseModel):
    title: NonBlankText = Field(max_length=500)
    body_markdown: NonBlankText


class MetadataUpdate(MetadataFields):
    pass


class PublishPostRequest(MetadataFields):
    title: NonBlankText = Field(max_length=500)
    body_markdown: NonBlankText


class DraftResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    body_markdown: str
    updated_at: datetime
    candidate_slug: str | None
    candidate_category: str | None
    candidate_tags: list[str] | None
    candidate_summary: str | None


class MetadataResponse(MetadataFields):
    pass


class PostListItem(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    slug: str
    category: str
    tags: list[str]
    summary: str
    published_at: datetime


class PostDetail(PostListItem):
    body_markdown: str


class ErrorDetail(BaseModel):
    code: str
    message: str
    field: str | None = None


class ErrorEnvelope(BaseModel):
    detail: ErrorDetail

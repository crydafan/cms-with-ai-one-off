"""Create the singleton draft and published posts tables."""

from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa

revision: str = "20260930_0001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "drafts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("body_markdown", sa.Text(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("candidate_slug", sa.String(length=200), nullable=True),
        sa.Column("candidate_category", sa.Text(), nullable=True),
        sa.Column("candidate_tags", sa.JSON(), nullable=True),
        sa.Column("candidate_summary", sa.Text(), nullable=True),
        sa.Column("candidate_source_hash", sa.String(length=64), nullable=True),
        sa.CheckConstraint("id = 1", name="ck_drafts_singleton_id"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_table(
        "published_posts",
        sa.Column("id", sa.Integer(), nullable=False),
        sa.Column("title", sa.Text(), nullable=False),
        sa.Column("body_markdown", sa.Text(), nullable=False),
        sa.Column("slug", sa.String(length=200), nullable=False),
        sa.Column("category", sa.Text(), nullable=False),
        sa.Column("tags", sa.JSON(), nullable=False),
        sa.Column("summary", sa.Text(), nullable=False),
        sa.Column("published_at", sa.DateTime(timezone=True), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("slug", name="uq_published_posts_slug"),
    )
    op.create_index("ix_published_posts_published_at_id", "published_posts", ["published_at", "id"])


def downgrade() -> None:
    op.drop_index("ix_published_posts_published_at_id", table_name="published_posts")
    op.drop_table("published_posts")
    op.drop_table("drafts")

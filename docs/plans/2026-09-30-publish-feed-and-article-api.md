# Publish, Feed, and Article API Implementation Record

## Scope

This slice implements `POST /api/draft/publish`, `GET /api/posts`, and `GET /api/posts/{slug}`.

## Implementation plan and technical decisions

- Publication recomputes the source hash from the submitted title/body and requires the saved candidate hash and all saved review fields to match the complete submitted article payload.
- A missing or stale candidate is rejected with a stable `409` envelope before any post or draft mutation.
- Slug availability is checked before insert and is protected by the database unique constraint. An integrity error is translated to `409 slug_taken` only when a post with that slug exists; other integrity failures propagate.
- The immutable post is created from the publish request body. Post insertion and resetting the singleton draft share one SQLAlchemy transaction, so failure rolls back both changes.
- The feed returns every post sorted by publication timestamp descending and id descending. Its Pydantic response omits Markdown. Detail lookup returns the full body or `404 post_not_found`.

## Retrospective

- The publish response uses the frozen post detail shape, including the newly published Markdown body, so the writer can identify the created post without a follow-up lookup.
- An unsaved slug change is rejected as a candidate mismatch before uniqueness is checked. The writer saves metadata before enabling publication, so an actual collision returns `slug_taken` while retaining the review.
- No changes to the shared migration were needed; both tables and constraints were created in the earlier baseline.

## Verification

- Applied the baseline migration to an isolated SQLite database.
- A Python workflow smoke check covered stale review rejection, duplicate-slug response with candidate preservation, successful post creation and draft reset, feed body omission, article body retrieval, and unknown-slug `404` mapping.
- `git diff --check` passed.
- No automated tests were added or run.

## Remaining limits

- Cross-request publication races are outside the accepted prototype scope; the database uniqueness constraint still prevents duplicate slugs.
- There is no pagination, filtering, or mutation endpoint for already published posts.

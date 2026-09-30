# Draft Persistence API Implementation Record

## Scope

This slice implements the shared single-draft persistence behavior and exposes it through `GET /api/draft` and `PUT /api/draft`.

## Implementation plan and technical decisions

- `GET /api/draft` creates the singleton row when missing and returns the persisted draft and any current metadata proposal.
- `PUT /api/draft` writes the submitted title and Markdown body without trimming the authored text.
- The draft workflow is isolated in `drafts.py`. Its session-scoped operations flush changes but leave commits to the route or a higher-level workflow. This allows metadata generation to commit the submitted snapshot before a provider call and allows publication to reset the draft within the post-creation transaction.
- A candidate is cleared only when the submitted title or body differs from the stored values. Re-saving identical content does not invalidate a valid review proposal.
- The API is intentionally shared and last-write-wins, without authentication, writer ownership, or cross-browser locking.

## Retrospective

- The frozen contract established a singleton row but did not dictate who owns transaction boundaries. Keeping service operations flush-only preserves atomicity for later workflows while allowing these routes to commit their own writes.
- Empty drafts remain valid through the draft update API; nonblank validation is applied when generation and publication require authored content.

## Verification

- Applied the baseline migration to an isolated SQLite database.
- Ran a Python smoke check covering initial singleton creation, authored-field persistence, candidate invalidation after changed content, and the single-row invariant.
- No automated tests were added or run.

## Remaining limits

- The initial empty row is created lazily by `GET /api/draft`.
- Concurrent writes across browsers remain last-write-wins by prototype decision.
- Metadata generation and review-edit endpoints are implemented in a later slice.

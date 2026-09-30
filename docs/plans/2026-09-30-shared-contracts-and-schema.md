# Shared Contracts and Schema Implementation Record

## Scope

This change freezes the API and storage shapes used by the draft, metadata, publication, and reader slices. It adds SQLAlchemy models and an Alembic baseline for the shared draft and published post tables, Pydantic request and response schemas, router registration points, a stable error envelope, and matching TypeScript types and fetch helpers.

## Implementation plan and technical decisions

- The draft table uses a database check constraint requiring `id = 1`, making the singleton rule enforceable by SQLite. It stores authored text, nullable candidate fields, and a candidate source hash.
- Published posts have a unique slug constraint, JSON tag list, UTC publication timestamp, and an index over publication time and id. Separate response shapes keep Markdown content out of feed cards.
- Tag lists accept up to five unique, nonblank values. Categories remain free-form. Slugs use lowercase URL-safe segments separated by hyphens.
- Draft title and Markdown body remain byte-for-byte text values after JSON decoding. Candidate source hashes use SHA-256 over compact UTF-8 JSON encoding of the exact `[title, body_markdown]` pair; this backend-only choice makes the plan's unspecified JSON encoding deterministic.
- SQLite datetime reads are restored as UTC-aware Python values. The Alembic environment derives its database URL from backend settings.
- FastAPI validation, application, HTTP, and unexpected errors use the `{detail: {code, message, field?}}` envelope. Stable status mappings are recorded for the planned domain errors.
- `apps/web/lib/types.ts` mirrors the wire contract. `lib/http.ts` provides typed browser and server fetch entry points, disables fetch caching by default for prototype content, and parses common API errors.

## Retrospective

- The plan did not specify how JSON array encoding should be canonicalized for the source hash. I chose compact JSON with `ensure_ascii=False`; the hash is generated and verified on the backend, so the browser does not need to reproduce that serialization.
- To enforce the single-draft rule at the storage boundary, the baseline includes a check constraint in addition to the fixed id convention.
- This slice defines contracts and schema only. Router stubs are registered, while feature behavior remains in later slices.

## Verification

- Alembic baseline upgrade succeeded against an isolated SQLite database in `/tmp`.
- A Python contract smoke check confirmed the tables, preserved submitted text, source-hash shape, payload construction, and body-free feed response schema.
- `pnpm --filter @cms/web exec tsc --noEmit` passed.
- `git diff --check` passed.
- No automated test suite was added or run.
- The first uv invocation could not open the default user cache under sandbox permissions; rerunning with `UV_CACHE_DIR=/tmp/cms-uv-cache` succeeded.

## Remaining limits

- Draft, metadata, publication, and reader routes are registered but have no feature handlers yet.
- Provider calls, draft persistence workflow, slug collision behavior, and end-to-end browser/API integration remain for later implementation slices.
- SQLite stores the tag arrays as JSON text; no database-specific tag querying is required by the prototype.

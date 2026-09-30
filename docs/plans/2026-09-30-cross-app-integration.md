# Cross-App Integration Implementation Record

## Scope

This slice verifies and tightens the connected FastAPI/Next.js prototype flow across draft autosave, metadata generation/review, final publication, the public feed, and the article page.

## Implementation plan and technical decisions

- Browser writer requests use `NEXT_PUBLIC_API_BASE_URL`; server-rendered reader requests use `API_SERVER_BASE_URL`. Both default to the local FastAPI origin.
- The FastAPI preflight allows the local Next.js origin and the required `POST`/`PUT` request methods. CORS remains connectivity configuration, not access control.
- The request sequence was exercised through the OpenAI SDK against a temporary local OpenAI-compatible mock provider: generate from the submitted draft, save edited review metadata, publish the complete body and metadata, read the summary-only feed, open the full article, and verify the draft reset.
- A separate missing-key request returned the common retryable generation error while preserving submitted draft text and leaving the candidate empty.
- The publication transaction's `IntegrityError` handler now covers the draft reset flush as well as commit, so a database-level slug collision can roll back both post insertion and draft reset.

## Retrospective

- No product decisions needed clarification; the accepted product specification and task cards resolved the implementation choices.
- Real DeepSeek credentials were unavailable. A local provider mock exercised the OpenAI-compatible request and response path without contacting DeepSeek.
- The computer-use integration reported that browser permissions were not granted. I verified server-rendered HTML through local HTTP requests and completed the API request sequence, but could not inspect hydrated writer interactions or take a browser screenshot.
- The sandbox blocks Turbopack's worker port binding. The webpack production build succeeded, so the checked-in application remains on the standard Next build command and the environment-specific limitation is recorded here.

## Verification

- The API `/health` and initial draft endpoints returned successful responses.
- A CORS preflight from `http://localhost:3000` returned `200` and the expected allow-origin/method headers.
- A missing-key generation request returned `503 metadata_generation_failed`; the draft remained saved and had no candidate.
- The mock-backed HTTP flow successfully generated metadata, saved writer edits, published, returned a body-free feed item, returned the full article body, and reset the singleton draft.
- Server-rendered homepage HTML contained the published summary and tags; the article route contained the title and formatted body; `/write` returned the writer page shell.
- `uv run alembic check` reported no new upgrade operations; Python bytecode compilation completed.
- Next route type generation, TypeScript type-check, ESLint, and `next build --webpack` passed. The build includes `/`, `/posts/[slug]`, and `/write`.
- `git diff --check` passed.
- No automated tests were added or run.

## Remaining limits

- Live DeepSeek service credentials, availability, and generated content quality remain unverified.
- The computer-use permission restriction prevented a visual browser review of the hydrated client UI.
- Cross-browser write races, pagination, authentication, and published-post editing remain outside the approved prototype scope.

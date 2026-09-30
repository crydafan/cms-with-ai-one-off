# Metadata Generation and Review API Implementation Record

## Scope

This slice connects the persisted draft to the DeepSeek provider and implements `POST /api/draft/generate` plus `PUT /api/draft/metadata`.

## Implementation plan and technical decisions

- Generation updates and commits the exact submitted title/body before calling the provider. The provider receives the request body directly, not a database read.
- Any previous candidate is cleared and committed before generation starts, even when the authored text is unchanged. This keeps a failed retry from leaving old metadata publishable.
- A validated response is stored as the candidate with the shared deterministic source hash. The response returned to the writer contains the candidate metadata fields.
- Provider, missing-key, empty, malformed, and invalid responses map to the stable `503 metadata_generation_failed` envelope. The authored draft remains saved and candidate fields remain empty.
- Review updates require a complete current candidate whose source hash still matches the persisted authored fields. Edits replace all candidate values in one commit.
- Draft service operations from the previous slice are reused so content changes continue to invalidate old review metadata.

## Retrospective

- The first workflow smoke check exposed a Pydantic conversion mismatch when returning `MetadataUpdate` as `MetadataResponse`. The service now copies the shared fields into the response schema explicitly.
- The provider failure check uses an in-process provider stub; it proves persistence and error translation but does not validate real DeepSeek output.

## Verification

- Alembic baseline applied to an isolated SQLite database.
- A Python workflow smoke check covered exact-source hashing, generated candidate persistence, writer metadata replacement, provider failure status mapping, and preservation of the authored draft with no stale candidate.
- Python compilation and frontend contract type-checks had passed in prior slices; no frontend files changed here.
- No automated tests were added or run.

## Remaining limits

- No live DeepSeek key was used, so network behavior and actual model response quality remain unverified.
- The workflow is synchronous and uses the provider's bounded request timeout.

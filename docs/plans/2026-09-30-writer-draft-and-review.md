# Writer Draft and Review Implementation Record

## Scope

This slice adds the unlinked `/write` page, a persistent single-draft editor, debounced review editing, the metadata skeleton, and the final publish action. The page is marked `noindex` and is not linked from the reader navigation.

## Implementation plan and technical decisions

- The browser loads the current draft through `GET /api/draft`; title and Markdown body remain in controlled inputs and autosave through `PUT /api/draft` after 500 ms without trimming authored text.
- Draft saves and metadata saves share one promise queue with generation and publication mutations. Each autosave family holds one pending snapshot so new input replaces queued content; failures preserve the local snapshot and provide an explicit retry.
- Generation sends the current title/body snapshot in the request. While it is pending, the editor is disabled and shadcn skeletons occupy the metadata review area. A retryable error leaves the authored text intact.
- Generated metadata is loaded from the persisted draft on return. The writer can edit slug, free-form category, up to five tags, and summary; valid edits autosave after 500 ms. Invalid values remain local and block publication.
- The final action submits the complete reviewed article body and metadata. A slug conflict is shown next to the slug field. Success resets the editor locally and links to the newly published article.
- The writer route has no authentication, consistent with the approved prototype scope.

## Retrospective

- The task card listed draft and metadata API clients but did not give the writer slice an owner for the publish request helper. I placed `publishDraft` in `draft-api.ts`, since the operation is `/api/draft/publish` and remains part of the writer's draft lifecycle.
- The existing shared TypeScript contract was missing the success response for publication. It now aliases the already-defined post detail shape, which matches the new post returned after publication.
- Mutation serialization was implemented in the editor component so the one-tab ordering contract spans draft saves, metadata saves, generation, and publication without introducing cross-client locking.

## Verification

- `pnpm --filter @cms/web exec next typegen` completed.
- `pnpm --filter @cms/web exec tsc --noEmit` passed.
- `pnpm --filter @cms/web lint` passed.
- `pnpm --filter @cms/web exec next build --webpack` passed and included `/write`.
- `git diff --check` passed.
- The metadata generation and publication routes are added in later backend slices; end-to-end writer requests are therefore not yet verified.
- No automated tests were added or run.

## Remaining limits

- The writer URL is intentionally unprotected and anyone who knows `/write` can edit the shared draft.
- Generation and publication need their API workflow slices before the complete writer journey is available.
- Cross-browser write conflicts remain last-write-wins by prototype decision.

# Minimal Reader and Writer UI Refactor

## Outcome

Refactored the reader feed, article page, and hidden writer studio to match the supplied minimal black-and-white references. The feed uses a simple masthead and a vertically ruled list; the writer uses a compact studio header, labeled title/content fields, and square outlined controls. The article page and Markdown rendering now use matching neutral typography.

## Decisions and implementation

- Kept the existing API and interaction flow intact: drafts autosave, metadata generation shows skeletons, generated metadata remains editable and reviewable, and publication stays behind the explicit final action.
- Feed entries emphasize the generated summary and include the post title, category, publication date, and tags. Raw Markdown is never rendered in the feed.
- Kept the `/write` studio entry point and its draft status/save indicator. No authentication, author field, or destructive clear control was added.
- Changed the article page and Markdown styles to neutral text, simple rules, and square surfaces for consistency with the references.

## Retrospective

The supplied screenshots describe a notes feed and writing form rather than the CMS domain directly. The implementation maps the screenshot's large feed text to the AI summary while retaining the post title as supporting text, preserving the product requirement that both appear in each feed entry. The screenshot's author label was omitted because authentication and author identity are out of scope.

## Verification

- `git diff --check` — passed.
- `pnpm --filter @cms/web exec tsc --noEmit` — passed.
- `pnpm --filter @cms/web exec eslint app/page.tsx 'app/posts/[slug]/page.tsx' components/post-card.tsx components/draft-editor.tsx components/metadata-review.tsx` — passed.
- `pnpm --filter @cms/web exec next build --webpack` — passed; `/`, `/posts/[slug]`, and `/write` built successfully.

## Remaining limits

- No browser-based pixel review was performed, so responsive appearance has been checked through source and a production build rather than screenshots rendered from the running application.
- This change adjusts presentation only; backend and persistence behavior were not revalidated.

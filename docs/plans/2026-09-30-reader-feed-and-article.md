# Reader Feed and Article Implementation Record

## Scope

This slice replaces the starter homepage with a public article feed and adds the dedicated `/posts/[slug]` reader route. Feed cards expose only display metadata; the article route loads the full body and renders it as Markdown.

## Implementation plan and technical decisions

- Reader requests use the server-only `API_SERVER_BASE_URL` fetch helper. Requests are uncached so the prototype shows current published data.
- Cards show category, publication date, title, summary, and SEO tags, and link to the encoded slug path. The article page shows the title, category, date, summary, tags, and full Markdown.
- `react-markdown` renders CommonMark as React elements, `remark-gfm` enables familiar tables and task lists, and `rehype-sanitize` filters the rendered tree. Embedded HTML is explicitly skipped.
- The feed shows a graceful API-unavailable message and a useful empty state. Unknown article slugs invoke Next's `notFound()` state.
- Reader styling uses an editorial green and warm paper palette with responsive cards and readable article typography.

## Retrospective

- The default scaffold imported Geist through `next/font/google`, which failed when the production build could not reach Google Fonts. I replaced it with local system font stacks, avoiding a network dependency at build time.
- Turbopack also failed because its CSS worker could not bind a local port in the sandbox, including on the approved retry. The equivalent webpack production build completed successfully; the default Turbopack build remains environment-limited.
- The feed displays the category alongside required tags as supplemental article context. It does not add search or category filtering.

## Verification

- `pnpm --filter @cms/web exec next typegen` generated current route types.
- `pnpm --filter @cms/web exec tsc --noEmit` passed.
- `pnpm --filter @cms/web lint` passed.
- `pnpm --filter @cms/web exec next build --webpack` passed and compiled the homepage, not-found page, and dynamic article route.
- Default `pnpm --filter @cms/web build` failed in Turbopack when it attempted to bind a port for a CSS worker; escalation did not change that sandbox restriction.
- `git diff --check` passed.
- No automated tests were added or run. The backend reader endpoints are added in a later slice, so browser/API end-to-end behavior is not yet verified.

## Remaining limits

- The reader UI depends on the published-post routes that have not been implemented yet.
- No pagination or filtering is included, by product scope.
- The published Markdown is sanitized, but there is no syntax-highlighting plugin for code blocks.

## Renderer references

- [react-markdown security guidance](https://github.com/remarkjs/react-markdown#security) describes safe-by-default rendering and recommends `rehype-sanitize` after plugins.
- [rehype-sanitize](https://github.com/rehypejs/rehype-sanitize) filters output through an allowlist schema.
- [remark-gfm](https://github.com/remarkjs/remark-gfm) adds GFM tables, strikethrough, task lists, and related syntax.

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import type { MetadataFields } from "@/lib/types"

export type MetadataSaveStatus = "idle" | "unsaved" | "saving" | "saved" | "error" | "invalid"

type MetadataReviewProps = {
  value: MetadataFields
  status: MetadataSaveStatus
  error: string | null
  errorField: string | null
  validationMessage: string | null
  canPublish: boolean
  isPublishing: boolean
  onChange: (value: MetadataFields) => void
  onRetrySave: () => void
  onPublish: () => void
  disabled: boolean
}

export function MetadataReview({
  value,
  status,
  error,
  errorField,
  validationMessage,
  canPublish,
  isPublishing,
  onChange,
  onRetrySave,
  onPublish,
  disabled,
}: MetadataReviewProps) {
  function update<K extends keyof MetadataFields>(key: K, fieldValue: MetadataFields[K]) {
    onChange({ ...value, [key]: fieldValue })
  }

  return (
    <section className="border-t border-neutral-300 pt-7" aria-labelledby="metadata-review-heading">
      <div className="flex flex-col justify-between gap-2 border-b border-neutral-300 pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-neutral-600 uppercase">AI metadata</p>
          <h2 id="metadata-review-heading" className="mt-2 text-xl font-medium tracking-[-0.025em] text-black">Review before publishing</h2>
        </div>
        <p className="text-xs text-neutral-500">Review or edit any field before publishing.</p>
      </div>

      {error ? (
        <Alert variant="destructive" className="mt-5 bg-white">
          <AlertTitle>{error}</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-x-1">
            {status === "error" ? (
              <>
                The review is still here. <button type="button" onClick={onRetrySave} className="font-medium underline underline-offset-2">Retry saving</button>.
              </>
            ) : (
              <>The review is still here; correct the field and try publishing again.</>
            )}
          </AlertDescription>
        </Alert>
      ) : null}

      {validationMessage ? (
        <p className="mt-5 text-sm text-red-700" role="alert">{validationMessage}</p>
      ) : null}

      <div className="mt-6 grid gap-x-5 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="metadata-slug" className="text-xs font-medium tracking-[0.1em] uppercase">Slug</label>
          <Input
            id="metadata-slug"
            value={value.slug}
            onChange={(event) => update("slug", event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={errorField === "slug" || Boolean(validationMessage && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug))}
            aria-describedby={errorField === "slug" ? "metadata-slug-server-error" : undefined}
            disabled={disabled}
            className="h-11 rounded-none border-black bg-white shadow-none focus-visible:border-black focus-visible:ring-black/20"
          />
          <p className="text-xs text-neutral-500">Lowercase words separated by hyphens.</p>
          {errorField === "slug" ? <p id="metadata-slug-server-error" className="text-xs text-red-700" role="alert">This slug is already published. Choose another.</p> : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="metadata-category" className="text-xs font-medium tracking-[0.1em] uppercase">Category</label>
          <Input
            id="metadata-category"
            value={value.category}
            onChange={(event) => update("category", event.target.value)}
            disabled={disabled}
            className="h-11 rounded-none border-black bg-white shadow-none focus-visible:border-black focus-visible:ring-black/20"
          />
          <p className="text-xs text-neutral-500">A free-form label for this story.</p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="metadata-summary" className="text-xs font-medium tracking-[0.1em] uppercase">Homepage summary</label>
          <Textarea
            id="metadata-summary"
            value={value.summary}
            onChange={(event) => update("summary", event.target.value)}
            rows={3}
            disabled={disabled}
            className="min-h-24 resize-y rounded-none border-black bg-white leading-6 shadow-none focus-visible:border-black focus-visible:ring-black/20"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="metadata-tags" className="text-xs font-medium tracking-[0.1em] uppercase">SEO tags</label>
          <Textarea
            id="metadata-tags"
            value={value.tags.join("\n")}
            onChange={(event) => update("tags", event.target.value.split("\n").map((tag) => tag.trim()).filter(Boolean))}
            rows={3}
            disabled={disabled}
            className="min-h-24 resize-y rounded-none border-black bg-white leading-6 shadow-none focus-visible:border-black focus-visible:ring-black/20"
            aria-describedby="metadata-tags-hint"
          />
          <p id="metadata-tags-hint" className="text-xs text-neutral-500">One tag per line, up to five.</p>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-4 border-t border-neutral-300 pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-neutral-500" aria-live="polite">
          {status === "saving" ? "Saving review changes…" : null}
          {status === "unsaved" ? "Changes will save automatically." : null}
          {status === "saved" ? "Your review is saved." : null}
          {status === "error" ? "Review changes could not be saved." : null}
          {status === "invalid" ? "Resolve the review issues before publishing." : null}
        </p>
        <Button
          type="button"
          onClick={onPublish}
          disabled={!canPublish || isPublishing}
          className="h-11 rounded-none border border-black bg-black px-6 font-medium text-white shadow-none hover:bg-neutral-800 disabled:border-neutral-300 disabled:bg-neutral-200 disabled:text-neutral-500"
        >
          {isPublishing ? "Publishing…" : "Publish now"}
        </Button>
      </div>
    </section>
  )
}

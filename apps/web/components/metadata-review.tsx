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
    <section className="rounded-2xl border border-[#dfe4dc] bg-[#fbfcf9] p-5 sm:p-7" aria-labelledby="metadata-review-heading">
      <div className="flex flex-col justify-between gap-2 border-b border-[#e4e8e2] pb-5 sm:flex-row sm:items-end">
        <div>
          <p className="text-[11px] font-semibold tracking-[0.16em] text-[#527462] uppercase">The finishing details</p>
          <h2 id="metadata-review-heading" className="mt-2 text-xl font-medium tracking-[-0.025em] text-[#293a30]">Review before publishing</h2>
        </div>
        <p className="text-xs text-[#748078]">AI prepared these fields. You can change any of them.</p>
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
        <p className="mt-5 text-sm text-[#9c452e]" role="alert">{validationMessage}</p>
      ) : null}

      <div className="mt-6 grid gap-x-5 gap-y-5 sm:grid-cols-2">
        <div className="space-y-2">
          <label htmlFor="metadata-slug" className="text-sm font-medium text-[#39483e]">Slug</label>
          <Input
            id="metadata-slug"
            value={value.slug}
            onChange={(event) => update("slug", event.target.value)}
            autoComplete="off"
            spellCheck={false}
            aria-invalid={errorField === "slug" || Boolean(validationMessage && !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug))}
            aria-describedby={errorField === "slug" ? "metadata-slug-server-error" : undefined}
            disabled={disabled}
            className="h-11 border-[#d7ded6] bg-white focus-visible:border-[#77917f] focus-visible:ring-[#77917f]/20"
          />
          <p className="text-xs text-[#7b857d]">Lowercase words separated by hyphens.</p>
          {errorField === "slug" ? <p id="metadata-slug-server-error" className="text-xs text-[#9c452e]" role="alert">This slug is already published. Choose another.</p> : null}
        </div>
        <div className="space-y-2">
          <label htmlFor="metadata-category" className="text-sm font-medium text-[#39483e]">Category</label>
          <Input
            id="metadata-category"
            value={value.category}
            onChange={(event) => update("category", event.target.value)}
            disabled={disabled}
            className="h-11 border-[#d7ded6] bg-white focus-visible:border-[#77917f] focus-visible:ring-[#77917f]/20"
          />
          <p className="text-xs text-[#7b857d]">A free-form label for this story.</p>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="metadata-summary" className="text-sm font-medium text-[#39483e]">Homepage summary</label>
          <Textarea
            id="metadata-summary"
            value={value.summary}
            onChange={(event) => update("summary", event.target.value)}
            rows={3}
            disabled={disabled}
            className="min-h-24 resize-y border-[#d7ded6] bg-white leading-6 focus-visible:border-[#77917f] focus-visible:ring-[#77917f]/20"
          />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <label htmlFor="metadata-tags" className="text-sm font-medium text-[#39483e]">SEO tags</label>
          <Textarea
            id="metadata-tags"
            value={value.tags.join("\n")}
            onChange={(event) => update("tags", event.target.value.split("\n").map((tag) => tag.trim()).filter(Boolean))}
            rows={3}
            disabled={disabled}
            className="min-h-24 resize-y border-[#d7ded6] bg-white leading-6 focus-visible:border-[#77917f] focus-visible:ring-[#77917f]/20"
            aria-describedby="metadata-tags-hint"
          />
          <p id="metadata-tags-hint" className="text-xs text-[#7b857d]">One tag per line, up to five.</p>
        </div>
      </div>

      <div className="mt-7 flex flex-col gap-4 border-t border-[#e4e8e2] pt-5 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-[#718077]" aria-live="polite">
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
          className="h-11 rounded-full bg-[#234b3c] px-6 font-medium text-white hover:bg-[#193b2e] disabled:bg-[#aeb9b0]"
        >
          {isPublishing ? "Publishing…" : "Publish now"}
        </Button>
      </div>
    </section>
  )
}

"use client"

import Link from "next/link"
import { useEffect, useRef, useState } from "react"
import { ArrowUpRight, Check, CircleAlert, LoaderCircle } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Skeleton } from "@/components/ui/skeleton"
import { Textarea } from "@/components/ui/textarea"
import { MetadataReview, type MetadataSaveStatus } from "@/components/metadata-review"
import { ApiRequestError } from "@/lib/http"
import { getDraft, publishDraft, saveDraft } from "@/lib/draft-api"
import { generateMetadata, saveMetadata } from "@/lib/metadata-api"
import type { Draft, DraftUpdate, MetadataFields, PublishPostRequest } from "@/lib/types"

type DraftSaveStatus = "saved" | "unsaved" | "saving" | "error"

const EMPTY_DRAFT: DraftUpdate = { title: "", body_markdown: "" }

function candidateFromDraft(draft: Draft): MetadataFields | null {
  const { candidate_slug, candidate_category, candidate_tags, candidate_summary } = draft
  if (candidate_slug === null || candidate_category === null || candidate_tags === null || candidate_summary === null) {
    return null
  }
  return {
    slug: candidate_slug,
    category: candidate_category,
    tags: candidate_tags,
    summary: candidate_summary,
  }
}

function validationMessage(value: MetadataFields): string | null {
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug)) {
    return "Use a lowercase URL-safe slug with words separated by hyphens."
  }
  if (!value.category.trim()) return "Add a category before publishing."
  if (!value.summary.trim()) return "Add a homepage summary before publishing."
  if (value.tags.length > 5) return "Use no more than five tags."
  if (value.tags.some((tag) => !tag.trim())) return "Remove blank tags."
  if (new Set(value.tags.map((tag) => tag.trim().toLocaleLowerCase())).size !== value.tags.length) {
    return "Each tag must be unique."
  }
  return null
}

function errorMessage(error: unknown, fallback: string): string {
  return error instanceof Error ? error.message : fallback
}

export function DraftEditor() {
  const [draft, setDraft] = useState<DraftUpdate>(EMPTY_DRAFT)
  const [metadata, setMetadata] = useState<MetadataFields | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [loadAttempt, setLoadAttempt] = useState(0)
  const [draftStatus, setDraftStatus] = useState<DraftSaveStatus>("saved")
  const [draftError, setDraftError] = useState<string | null>(null)
  const [metadataStatus, setMetadataStatus] = useState<MetadataSaveStatus>("idle")
  const [metadataError, setMetadataError] = useState<string | null>(null)
  const [generationError, setGenerationError] = useState<string | null>(null)
  const [publishError, setPublishError] = useState<string | null>(null)
  const [publishErrorField, setPublishErrorField] = useState<string | null>(null)
  const [publishedSlug, setPublishedSlug] = useState<string | null>(null)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isPublishing, setIsPublishing] = useState(false)

  const latestDraftRef = useRef<DraftUpdate>(EMPTY_DRAFT)
  const metadataRef = useRef<MetadataFields | null>(null)
  const pendingDraftRef = useRef<DraftUpdate | null>(null)
  const pendingMetadataRef = useRef<MetadataFields | null>(null)
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const metadataTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const draftFlushQueuedRef = useRef(false)
  const metadataFlushQueuedRef = useRef(false)
  const draftRetryBlockedRef = useRef(false)
  const metadataRetryBlockedRef = useRef(false)
  const mutationQueueRef = useRef<Promise<unknown>>(Promise.resolve())

  function enqueueMutation<T>(operation: () => Promise<T>): Promise<T> {
    const next = mutationQueueRef.current.then(operation, operation)
    mutationQueueRef.current = next.then(() => undefined, () => undefined)
    return next
  }

  useEffect(() => {
    const controller = new AbortController()

    void getDraft(controller.signal)
      .then((saved) => {
        if (controller.signal.aborted) return
        const content = { title: saved.title, body_markdown: saved.body_markdown }
        const candidate = candidateFromDraft(saved)
        latestDraftRef.current = content
        metadataRef.current = candidate
        setDraft(content)
        setMetadata(candidate)
        setDraftStatus("saved")
        setMetadataStatus(candidate ? "saved" : "idle")
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) setLoadError(errorMessage(error, "Could not load the saved draft."))
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false)
      })

    return () => controller.abort()
  }, [loadAttempt])

  useEffect(() => () => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    if (metadataTimerRef.current) clearTimeout(metadataTimerRef.current)
  }, [])

  function flushDraftSave() {
    if (draftFlushQueuedRef.current || draftRetryBlockedRef.current || !pendingDraftRef.current) return
    draftFlushQueuedRef.current = true

    void enqueueMutation(async () => {
      const snapshot = pendingDraftRef.current
      if (!snapshot) return
      pendingDraftRef.current = null
      setDraftStatus("saving")
      setDraftError(null)
      try {
        await saveDraft(snapshot)
        if (!pendingDraftRef.current) setDraftStatus("saved")
      } catch (error) {
        if (!pendingDraftRef.current) pendingDraftRef.current = snapshot
        draftRetryBlockedRef.current = true
        setDraftStatus("error")
        setDraftError(errorMessage(error, "Your draft could not be saved."))
      }
    }).finally(() => {
      draftFlushQueuedRef.current = false
      if (pendingDraftRef.current && !draftTimerRef.current && !draftRetryBlockedRef.current) flushDraftSave()
    })
  }

  function scheduleDraftSave(snapshot: DraftUpdate) {
    pendingDraftRef.current = snapshot
    draftRetryBlockedRef.current = false
    setDraftStatus("unsaved")
    setDraftError(null)
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = setTimeout(() => {
      draftTimerRef.current = null
      flushDraftSave()
    }, 500)
  }

  function retryDraftSave() {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = null
    draftRetryBlockedRef.current = false
    if (!pendingDraftRef.current) pendingDraftRef.current = latestDraftRef.current
    flushDraftSave()
  }

  function flushMetadataSave() {
    if (metadataFlushQueuedRef.current || metadataRetryBlockedRef.current || !pendingMetadataRef.current) return
    metadataFlushQueuedRef.current = true

    void enqueueMutation(async () => {
      const snapshot = pendingMetadataRef.current
      if (!snapshot) return
      pendingMetadataRef.current = null
      setMetadataStatus("saving")
      setMetadataError(null)
      try {
        await saveMetadata(snapshot)
        if (!pendingMetadataRef.current) setMetadataStatus("saved")
      } catch (error) {
        if (!pendingMetadataRef.current) pendingMetadataRef.current = snapshot
        metadataRetryBlockedRef.current = true
        setMetadataStatus("error")
        setMetadataError(errorMessage(error, "Your review changes could not be saved."))
      }
    }).finally(() => {
      metadataFlushQueuedRef.current = false
      if (pendingMetadataRef.current && !metadataTimerRef.current && !metadataRetryBlockedRef.current) flushMetadataSave()
    })
  }

  function scheduleMetadataSave(snapshot: MetadataFields) {
    pendingMetadataRef.current = snapshot
    metadataRetryBlockedRef.current = false
    setMetadataStatus("unsaved")
    setMetadataError(null)
    if (metadataTimerRef.current) clearTimeout(metadataTimerRef.current)
    metadataTimerRef.current = setTimeout(() => {
      metadataTimerRef.current = null
      flushMetadataSave()
    }, 500)
  }

  function retryMetadataSave() {
    if (metadataTimerRef.current) clearTimeout(metadataTimerRef.current)
    metadataTimerRef.current = null
    metadataRetryBlockedRef.current = false
    if (metadataRef.current && !pendingMetadataRef.current) pendingMetadataRef.current = metadataRef.current
    flushMetadataSave()
  }

  function updateAuthoredField(field: keyof DraftUpdate, value: string) {
    const next = { ...latestDraftRef.current, [field]: value }
    latestDraftRef.current = next
    setDraft(next)
    setPublishedSlug(null)
    setPublishError(null)
    setPublishErrorField(null)
    setGenerationError(null)

    metadataRef.current = null
    pendingMetadataRef.current = null
    metadataRetryBlockedRef.current = false
    if (metadataTimerRef.current) clearTimeout(metadataTimerRef.current)
    metadataTimerRef.current = null
    setMetadata(null)
    setMetadataStatus("idle")
    setMetadataError(null)

    scheduleDraftSave(next)
  }

  async function handleGenerate() {
    if (isGenerating || !latestDraftRef.current.title.trim() || !latestDraftRef.current.body_markdown.trim()) return
    const snapshot = { ...latestDraftRef.current }
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current)
    draftTimerRef.current = null
    setIsGenerating(true)
    setGenerationError(null)
    setPublishError(null)
    setPublishErrorField(null)
    setMetadata(null)
    metadataRef.current = null
    pendingMetadataRef.current = null
    setMetadataStatus("idle")

    try {
      const generated = await enqueueMutation(() => generateMetadata(snapshot))
      metadataRef.current = generated
      setMetadata(generated)
      setMetadataStatus("saved")
      setDraftStatus("saved")
      pendingDraftRef.current = null
      draftRetryBlockedRef.current = false
    } catch (error) {
      setGenerationError(errorMessage(error, "Metadata could not be generated. Please retry."))
      if (error instanceof ApiRequestError && error.code === "metadata_generation_failed") {
        pendingDraftRef.current = null
        draftRetryBlockedRef.current = false
        setDraftStatus("saved")
        setDraftError(null)
      } else {
        pendingDraftRef.current = snapshot
        draftRetryBlockedRef.current = false
        flushDraftSave()
      }
    } finally {
      setIsGenerating(false)
    }
  }

  function handleMetadataChange(next: MetadataFields) {
    metadataRef.current = next
    setMetadata(next)
    setPublishError(null)
    setPublishErrorField(null)

    const issue = validationMessage(next)
    if (issue) {
      if (metadataTimerRef.current) clearTimeout(metadataTimerRef.current)
      metadataTimerRef.current = null
      pendingMetadataRef.current = null
      metadataRetryBlockedRef.current = true
      setMetadataStatus("invalid")
      setMetadataError(null)
      return
    }

    scheduleMetadataSave(next)
  }

  async function handlePublish() {
    const currentMetadata = metadataRef.current
    const currentDraft = latestDraftRef.current
    if (!currentMetadata || validationMessage(currentMetadata) || metadataStatus !== "saved" || isPublishing) return
    if (draftStatus !== "saved" && pendingDraftRef.current) return

    if (metadataTimerRef.current) clearTimeout(metadataTimerRef.current)
    metadataTimerRef.current = null
    setIsPublishing(true)
    setPublishError(null)
    setPublishErrorField(null)
    const payload: PublishPostRequest = { ...currentDraft, ...currentMetadata }

    try {
      const post = await enqueueMutation(async () => {
        const pending = pendingMetadataRef.current
        if (pending) {
          await saveMetadata(pending)
          pendingMetadataRef.current = null
          setMetadataStatus("saved")
        }
        return publishDraft(payload)
      })
      latestDraftRef.current = EMPTY_DRAFT
      metadataRef.current = null
      pendingDraftRef.current = null
      pendingMetadataRef.current = null
      draftRetryBlockedRef.current = false
      metadataRetryBlockedRef.current = false
      setDraft(EMPTY_DRAFT)
      setMetadata(null)
      setDraftStatus("saved")
      setDraftError(null)
      setMetadataStatus("idle")
      setMetadataError(null)
      setGenerationError(null)
      setPublishedSlug(post.slug)
    } catch (error) {
      if (error instanceof ApiRequestError && error.code === "slug_taken") {
        setPublishError("That slug is already in use. Choose another slug to publish this post.")
        setPublishErrorField("slug")
      } else {
        setPublishError(errorMessage(error, "The post could not be published. Your review is still available."))
        setPublishErrorField(error instanceof ApiRequestError ? error.field ?? null : null)
      }
    } finally {
      setIsPublishing(false)
    }
  }

  const reviewIssue = metadata ? validationMessage(metadata) : null
  const canGenerate = Boolean(draft.title.trim() && draft.body_markdown.trim()) && !isGenerating && !isLoading
  const canPublish = Boolean(metadata) && !reviewIssue && metadataStatus === "saved" && draftStatus === "saved" && !isGenerating && !isPublishing

  if (isLoading) {
    return <WriterLoadingState />
  }

  if (loadError) {
    return (
      <WriterFrame>
        <Alert variant="destructive" className="bg-white">
          <AlertTitle>The saved draft could not load</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center gap-x-1">
            {loadError} <button type="button" onClick={() => { setIsLoading(true); setLoadError(null); setLoadAttempt((attempt) => attempt + 1) }} className="font-medium underline underline-offset-2">Try again</button>.
          </AlertDescription>
        </Alert>
      </WriterFrame>
    )
  }

  return (
    <WriterFrame>
      {publishedSlug ? (
        <Alert className="mb-8 border-[#c8d7ca] bg-[#f2f7f1] text-[#294c37]">
          <Check className="size-4" />
          <AlertTitle>Your story is live</AlertTitle>
          <AlertDescription>
            <Link href={`/posts/${encodeURIComponent(publishedSlug)}`} className="inline-flex items-center gap-1 font-medium underline underline-offset-2">
              Read the published story <ArrowUpRight className="size-3.5" />
            </Link>
            <span className="ml-2">A fresh draft is ready below.</span>
          </AlertDescription>
        </Alert>
      ) : null}

      <div className="mb-9 flex flex-col gap-4 border-b border-[#dce1da] pb-7 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="mb-3 text-[11px] font-semibold tracking-[0.18em] text-[#527462] uppercase">The writer&apos;s desk</p>
          <h1 className="text-4xl leading-[1.04] font-medium tracking-[-0.05em] text-[#26362c] sm:text-5xl">Make room for a thought.</h1>
          <p className="mt-3 max-w-xl text-sm leading-6 text-[#6b766e]">Write without worrying about the finishing details. Your draft saves as you go.</p>
        </div>
        <DraftSaveIndicator status={draftStatus} error={draftError} onRetry={retryDraftSave} />
      </div>

      <form
        onSubmit={(event) => {
          event.preventDefault()
          void handleGenerate()
        }}
        className="space-y-7"
      >
        <div className="space-y-2.5">
          <label htmlFor="draft-title" className="text-sm font-medium text-[#39483e]">Title</label>
          <Input
            id="draft-title"
            name="title"
            value={draft.title}
            onChange={(event) => updateAuthoredField("title", event.target.value)}
            placeholder="Give this piece a working title"
            maxLength={500}
            disabled={isGenerating || isPublishing}
            className="h-14 border-[#d7ded6] bg-white px-4 text-lg shadow-none placeholder:text-[#a2aaa3] focus-visible:border-[#77917f] focus-visible:ring-[#77917f]/20"
          />
        </div>

        <div className="space-y-2.5">
          <div className="flex items-center justify-between gap-3">
            <label htmlFor="draft-body" className="text-sm font-medium text-[#39483e]">Your writing</label>
            <span className="text-xs text-[#879189]">Markdown supported</span>
          </div>
          <Textarea
            id="draft-body"
            name="body_markdown"
            value={draft.body_markdown}
            onChange={(event) => updateAuthoredField("body_markdown", event.target.value)}
            placeholder="Start with the idea on your mind…"
            disabled={isGenerating || isPublishing}
            className="min-h-[24rem] resize-y border-[#d7ded6] bg-white px-4 py-4 text-[15px] leading-7 shadow-none placeholder:text-[#a2aaa3] focus-visible:border-[#77917f] focus-visible:ring-[#77917f]/20 sm:min-h-[30rem]"
          />
        </div>

        <div className="flex flex-col items-start gap-3 border-t border-[#dce1da] pt-6 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-[#39483e]">Ready to shape the details?</p>
            <p className="mt-1 text-xs text-[#79847c]">We&apos;ll prepare a preview for you to review before anything goes live.</p>
          </div>
          <Button
            type="submit"
            disabled={!canGenerate}
            className="h-11 rounded-full bg-[#234b3c] px-6 font-medium text-white hover:bg-[#193b2e] disabled:bg-[#aeb9b0]"
          >
            {isGenerating ? <><LoaderCircle className="mr-2 size-4 animate-spin" /> Preparing preview…</> : metadata ? "Regenerate preview" : generationError ? "Try again" : "Prepare preview"}
          </Button>
        </div>
      </form>

      {generationError ? (
        <Alert variant="destructive" className="mt-6 bg-white">
          <CircleAlert className="size-4" />
          <AlertTitle>Metadata could not be prepared</AlertTitle>
          <AlertDescription>{generationError} Your writing is still here; you can retry when you&apos;re ready.</AlertDescription>
        </Alert>
      ) : null}

      {isGenerating ? <MetadataLoadingState /> : null}

      {metadata ? (
        <div className="mt-8">
          <MetadataReview
            value={metadata}
            status={metadataStatus}
            error={metadataError ?? publishError}
            validationMessage={reviewIssue}
            errorField={publishErrorField}
            canPublish={canPublish}
            isPublishing={isPublishing}
            onChange={handleMetadataChange}
            onRetrySave={retryMetadataSave}
            onPublish={() => void handlePublish()}
            disabled={isPublishing}
          />
        </div>
      ) : null}
    </WriterFrame>
  )
}

function WriterFrame({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-screen bg-[#f7f6f2] text-[#202620]">
      <div className="mx-auto max-w-4xl px-6 pb-20 pt-7 sm:px-10 lg:px-12">
        <header className="mb-12 flex items-center justify-between border-b border-[#d8ddd5] pb-4">
          <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold tracking-[0.14em] text-[#52655a] uppercase hover:text-[#234b3c]">
            <span aria-hidden="true">←</span> Back to Fieldnotes
          </Link>
          <span className="text-[10px] font-medium tracking-[0.14em] text-[#8a938c] uppercase">Private writing space</span>
        </header>
        {children}
      </div>
    </main>
  )
}

function DraftSaveIndicator({ status, error, onRetry }: { status: DraftSaveStatus; error: string | null; onRetry: () => void }) {
  return (
    <div className="flex min-h-8 items-center gap-2 text-xs" aria-live="polite">
      {status === "saved" ? <Check className="size-3.5 text-[#567c62]" /> : null}
      {status === "saving" ? <LoaderCircle className="size-3.5 animate-spin text-[#718277]" /> : null}
      {status === "error" ? <CircleAlert className="size-3.5 text-[#a64e38]" /> : null}
      <span className={status === "error" ? "text-[#9c452e]" : "text-[#758078]"}>
        {status === "saved" ? "Draft saved" : null}
        {status === "unsaved" ? "Unsaved changes" : null}
        {status === "saving" ? "Saving draft…" : null}
        {status === "error" ? error ?? "Couldn't save draft." : null}
      </span>
      {status === "error" ? <button type="button" onClick={onRetry} className="font-medium text-[#315d49] underline underline-offset-2">Retry</button> : null}
    </div>
  )
}

function WriterLoadingState() {
  return (
    <WriterFrame>
      <div className="mb-9 space-y-4 border-b border-[#dce1da] pb-7">
        <Skeleton className="h-3 w-28 bg-[#e5e9e2]" />
        <Skeleton className="h-12 w-3/4 bg-[#e5e9e2]" />
        <Skeleton className="h-4 w-2/3 bg-[#e5e9e2]" />
      </div>
      <Skeleton className="mb-3 h-4 w-14 bg-[#e5e9e2]" />
      <Skeleton className="h-14 w-full bg-[#e5e9e2]" />
      <Skeleton className="mt-8 h-4 w-24 bg-[#e5e9e2]" />
      <Skeleton className="mt-3 h-[28rem] w-full bg-[#e5e9e2]" />
    </WriterFrame>
  )
}

function MetadataLoadingState() {
  return (
    <section className="mt-8 rounded-2xl border border-[#dfe4dc] bg-[#fbfcf9] p-5 sm:p-7" aria-live="polite" aria-label="Preparing metadata preview">
      <div className="mb-7 space-y-3">
        <Skeleton className="h-3 w-36 bg-[#e4e9e2]" />
        <Skeleton className="h-6 w-56 bg-[#e4e9e2]" />
      </div>
      <div className="grid gap-5 sm:grid-cols-2">
        <Skeleton className="h-[4.25rem] w-full bg-[#e4e9e2]" />
        <Skeleton className="h-[4.25rem] w-full bg-[#e4e9e2]" />
        <Skeleton className="h-24 w-full bg-[#e4e9e2] sm:col-span-2" />
        <Skeleton className="h-24 w-full bg-[#e4e9e2] sm:col-span-2" />
      </div>
    </section>
  )
}

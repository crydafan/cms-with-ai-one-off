import { browserApiFetch } from "@/lib/http"
import type { Draft, DraftUpdate, PublishPostRequest, PublishPostResponse } from "@/lib/types"

export function getDraft(signal?: AbortSignal): Promise<Draft> {
  return browserApiFetch<Draft>("/api/draft", { signal })
}

export function saveDraft(draft: DraftUpdate): Promise<Draft> {
  return browserApiFetch<Draft>("/api/draft", {
    method: "PUT",
    body: JSON.stringify(draft),
  })
}

export function publishDraft(post: PublishPostRequest): Promise<PublishPostResponse> {
  return browserApiFetch<PublishPostResponse>("/api/draft/publish", {
    method: "POST",
    body: JSON.stringify(post),
  })
}

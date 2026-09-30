import { browserApiFetch } from "@/lib/http"
import type { GenerateMetadataRequest, MetadataFields, MetadataUpdate } from "@/lib/types"

export function generateMetadata(draft: GenerateMetadataRequest): Promise<MetadataFields> {
  return browserApiFetch<MetadataFields>("/api/draft/generate", {
    method: "POST",
    body: JSON.stringify(draft),
  })
}

export function saveMetadata(metadata: MetadataUpdate): Promise<MetadataFields> {
  return browserApiFetch<MetadataFields>("/api/draft/metadata", {
    method: "PUT",
    body: JSON.stringify(metadata),
  })
}

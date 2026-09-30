export type Draft = {
  id: number
  title: string
  body_markdown: string
  updated_at: string
  candidate_slug: string | null
  candidate_category: string | null
  candidate_tags: string[] | null
  candidate_summary: string | null
}

export type DraftUpdate = {
  title: string
  body_markdown: string
}

export type GenerateMetadataRequest = DraftUpdate

export type MetadataFields = {
  slug: string
  category: string
  tags: string[]
  summary: string
}

export type MetadataUpdate = MetadataFields

export type PublishPostRequest = DraftUpdate & MetadataFields

export type PostListItem = {
  id: number
  title: string
  slug: string
  category: string
  tags: string[]
  summary: string
  published_at: string
}

export type PostDetail = PostListItem & {
  body_markdown: string
}

export type ApiErrorDetail = {
  code: string
  message: string
  field?: string
}

export type ApiErrorEnvelope = {
  detail: ApiErrorDetail
}

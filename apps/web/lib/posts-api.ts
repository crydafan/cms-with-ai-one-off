import { serverApiFetch } from "@/lib/http"
import type { PostDetail, PostListItem } from "@/lib/types"

export function getPosts(): Promise<PostListItem[]> {
  return serverApiFetch<PostListItem[]>("/api/posts")
}

export function getPost(slug: string): Promise<PostDetail> {
  return serverApiFetch<PostDetail>(`/api/posts/${encodeURIComponent(slug)}`)
}

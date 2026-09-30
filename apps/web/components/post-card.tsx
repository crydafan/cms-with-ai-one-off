import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import type { PostListItem } from "@/lib/types"

export function PostCard({ post, featured = false }: { post: PostListItem; featured?: boolean }) {
  const publishedDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(post.published_at))

  return (
    <Link
      href={`/posts/${encodeURIComponent(post.slug)}`}
      className={`group flex min-h-64 flex-col rounded-2xl border border-[#e0e3dd] bg-white p-6 transition-all hover:-translate-y-0.5 hover:border-[#aebcaf] hover:shadow-[0_16px_40px_-30px_rgba(27,47,34,0.45)] focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-[#527462] sm:p-7 ${featured ? "md:col-span-2 md:min-h-72 md:p-9" : ""}`}
    >
      <div className="flex items-center justify-between gap-4 text-[11px] font-medium tracking-[0.13em] text-[#768078] uppercase">
        <span className="truncate">{post.category}</span>
        <time dateTime={post.published_at} className="shrink-0 tracking-[0.08em]">{publishedDate}</time>
      </div>
      <h2 className={`mt-7 max-w-3xl text-2xl leading-tight font-medium tracking-[-0.035em] text-[#26362c] group-hover:text-[#315d49] ${featured ? "md:text-4xl" : ""}`}>
        {post.title}
      </h2>
      <p className={`mt-3 max-w-2xl text-sm leading-6 text-[#68736b] ${featured ? "md:text-base md:leading-7" : "line-clamp-3"}`}>
        {post.summary}
      </p>
      <div className="mt-auto flex flex-wrap gap-2 pt-7" aria-label="Article tags">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="h-6 rounded-full border-[#dce2db] bg-[#f7f8f5] px-2.5 text-[11px] font-normal text-[#52655a]">
            {tag}
          </Badge>
        ))}
      </div>
    </Link>
  )
}

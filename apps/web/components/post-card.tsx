import Link from "next/link"

import { Badge } from "@/components/ui/badge"
import type { PostListItem } from "@/lib/types"

export function PostCard({ post }: { post: PostListItem }) {
  const publishedDate = new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(post.published_at))

  return (
    <article className="border-b border-neutral-300 py-8 first:pt-8 sm:py-10">
      <Link
        href={`/posts/${encodeURIComponent(post.slug)}`}
        className="group block rounded-sm focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-black"
      >
        <div className="flex flex-wrap items-center gap-x-5 gap-y-1 text-xs font-medium tracking-[0.1em] text-neutral-600 uppercase">
          <span className="text-black">{post.category}</span>
          <time dateTime={post.published_at}>{publishedDate}</time>
        </div>
        <h2 className="mt-5 max-w-5xl text-2xl leading-[1.3] font-normal tracking-[-0.04em] text-black group-hover:underline group-hover:decoration-1 group-hover:underline-offset-4 sm:text-3xl sm:leading-[1.35] lg:text-[2rem]">
          {post.summary || post.title}
        </h2>
        <p className="mt-3 text-sm font-medium text-neutral-600 group-hover:text-black sm:text-base">{post.title}</p>
      </Link>
      <div className="mt-5 flex flex-wrap gap-2" aria-label="Article tags">
        {post.tags.map((tag) => (
          <Badge key={tag} variant="outline" className="h-auto rounded-none border-neutral-300 bg-transparent px-2 py-1 text-[10px] font-normal tracking-[0.08em] text-neutral-600 uppercase">
            {tag}
          </Badge>
        ))}
      </div>
    </article>
  )
}

import Link from "next/link"
import { notFound } from "next/navigation"

import { Badge } from "@/components/ui/badge"
import { MarkdownContent } from "@/components/markdown-content"
import { ApiRequestError } from "@/lib/http"
import { getPost } from "@/lib/posts-api"

export default async function PostPage({ params }: PageProps<"/posts/[slug]">) {
  const { slug } = await params
  let post

  try {
    post = await getPost(slug)
  } catch (error) {
    if (error instanceof ApiRequestError && (error.status === 404 || error.code === "post_not_found")) {
      notFound()
    }
    throw error
  }

  const publishedDate = new Intl.DateTimeFormat("en", {
    month: "long",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(post.published_at))

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-8 sm:px-10 lg:px-12">
        <header className="border-b border-black pb-4">
          <Link href="/" className="text-sm font-medium tracking-[0.14em] uppercase" aria-label="Back to Fieldnotes home">
            Feed · Notes
          </Link>
        </header>

        <article className="mx-auto max-w-3xl pt-14 sm:pt-20">
          <Link href="/" className="text-xs font-medium tracking-[0.12em] text-neutral-600 uppercase hover:text-black hover:underline">
            ← All writing
          </Link>
          <div className="mt-8 flex items-center gap-4 text-xs font-medium tracking-[0.1em] text-neutral-600 uppercase">
            <span>{post.category}</span>
            <span aria-hidden="true">·</span>
            <time dateTime={post.published_at}>{publishedDate}</time>
          </div>
          <h1 className="mt-6 text-4xl leading-[1.08] font-medium tracking-[-0.05em] text-black sm:text-6xl">
            {post.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-neutral-600">{post.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Article tags">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="h-auto rounded-none border-neutral-300 bg-white px-2 py-1 text-[10px] font-normal tracking-[0.08em] text-neutral-600 uppercase">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="my-10 h-px bg-neutral-300" />
          <MarkdownContent content={post.body_markdown} />
        </article>
      </div>
    </main>
  )
}

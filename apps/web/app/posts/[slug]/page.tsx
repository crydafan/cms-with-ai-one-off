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
    <main className="min-h-screen bg-[#f7f6f2] text-[#202620]">
      <div className="mx-auto max-w-4xl px-6 pb-24 pt-8 sm:px-10 lg:px-12">
        <header className="border-b border-[#d8ddd5] pb-5">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Back to Fieldnotes home">
            <span className="grid size-9 place-items-center rounded-full bg-[#234b3c] text-sm font-semibold text-white">F</span>
            <span className="text-sm font-semibold tracking-[0.12em] uppercase">Fieldnotes</span>
          </Link>
        </header>

        <article className="mx-auto max-w-3xl pt-14 sm:pt-20">
          <Link href="/" className="text-xs font-semibold tracking-[0.14em] text-[#527462] uppercase hover:underline">
            ← All writing
          </Link>
          <div className="mt-10 flex items-center gap-3 text-[11px] font-medium tracking-[0.15em] text-[#768078] uppercase">
            <span>{post.category}</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-[#91a196]" />
            <time dateTime={post.published_at}>{publishedDate}</time>
          </div>
          <h1 className="mt-5 text-4xl leading-[1.05] font-medium tracking-[-0.05em] text-[#26362c] sm:text-6xl">
            {post.title}
          </h1>
          <p className="mt-6 max-w-2xl text-lg leading-8 text-[#667269]">{post.summary}</p>
          <div className="mt-6 flex flex-wrap gap-2" aria-label="Article tags">
            {post.tags.map((tag) => (
              <Badge key={tag} variant="outline" className="h-6 rounded-full border-[#dce2db] bg-white px-2.5 text-[11px] font-normal text-[#52655a]">
                {tag}
              </Badge>
            ))}
          </div>
          <div className="my-10 h-px bg-[#d8ddd5]" />
          <MarkdownContent content={post.body_markdown} />
        </article>
      </div>
    </main>
  )
}

import Link from "next/link"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { PostCard } from "@/components/post-card"
import { getPosts } from "@/lib/posts-api"
import type { PostListItem } from "@/lib/types"

export const metadata = {
  title: "Ideas in progress",
}

export default async function HomePage() {
  let posts: PostListItem[] | null = null
  let hasError = false
  try {
    posts = await getPosts()
  } catch {
    hasError = true
  }

  return (
    <main className="min-h-screen bg-white text-black">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-black pb-4">
          <Link href="/" className="text-[15px] font-medium tracking-[0.14em] uppercase" aria-label="Fieldnotes home">
            Feed · Notes
          </Link>
          <span className="text-xs tracking-[0.12em] text-neutral-500 uppercase">
            {posts ? `${posts.length} ${posts.length === 1 ? "note" : "notes"}` : "Latest"}
          </span>
        </header>

        {hasError ? (
          <Alert variant="destructive" className="mx-auto max-w-2xl bg-white">
            <AlertTitle>The feed could not load</AlertTitle>
            <AlertDescription>
              Check that the API is running, then <Link href="/" className="font-medium">refresh this page</Link>.
            </AlertDescription>
          </Alert>
        ) : posts?.length ? (
          <section aria-label="Published articles" className="mt-7">
            {posts.map((post) => (
              <PostCard key={post.id} post={post} />
            ))}
          </section>
        ) : (
          <section className="py-14">
            <p className="text-lg italic text-neutral-500">No notes yet.</p>
          </section>
        )}

        <footer className="mt-12 border-t border-neutral-200 pt-4 text-xs tracking-[0.1em] text-neutral-500 uppercase">
          Fieldnotes
        </footer>
      </div>
    </main>
  )
}

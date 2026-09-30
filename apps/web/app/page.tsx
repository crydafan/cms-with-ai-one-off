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
    <main className="min-h-screen bg-[#f7f6f2] text-[#202620]">
      <div className="mx-auto max-w-6xl px-6 pb-20 pt-8 sm:px-10 lg:px-12">
        <header className="flex items-center justify-between border-b border-[#d8ddd5] pb-5">
          <Link href="/" className="inline-flex items-center gap-2.5" aria-label="Fieldnotes home">
            <span className="grid size-9 place-items-center rounded-full bg-[#234b3c] text-sm font-semibold text-white">F</span>
            <span className="text-sm font-semibold tracking-[0.12em] uppercase">Fieldnotes</span>
          </Link>
          <span className="text-xs font-medium tracking-[0.16em] text-[#66736a] uppercase">Writing &amp; ideas</span>
        </header>

        <section className="grid gap-8 pb-14 pt-14 md:grid-cols-[1.05fr_0.95fr] md:items-end md:pt-20">
          <div>
            <p className="mb-4 text-xs font-semibold tracking-[0.19em] text-[#527462] uppercase">A collection of thoughts</p>
            <h1 className="max-w-2xl text-5xl leading-[0.98] font-medium tracking-[-0.055em] sm:text-6xl md:text-7xl">
              Ideas worth
              <br />
              <span className="font-serif italic text-[#547363]">keeping.</span>
            </h1>
          </div>
          <div className="max-w-md border-l border-[#cbd2c9] pl-5 pb-1 md:ml-auto">
            <p className="text-base leading-7 text-[#59655d]">
              Notes, observations, and longer reads on the things that shape how we work and live.
            </p>
            <p className="mt-5 text-xs font-medium tracking-[0.14em] text-[#758078] uppercase">
              {posts ? `${posts.length} published ${posts.length === 1 ? "story" : "stories"}` : "Latest writing"}
            </p>
          </div>
        </section>

        {hasError ? (
          <Alert variant="destructive" className="mx-auto max-w-2xl bg-white">
            <AlertTitle>The feed could not load</AlertTitle>
            <AlertDescription>
              Check that the API is running, then <Link href="/" className="font-medium">refresh this page</Link>.
            </AlertDescription>
          </Alert>
        ) : posts?.length ? (
          <section aria-label="Published articles" className="grid gap-4 md:grid-cols-2">
            {posts.map((post, index) => (
              <PostCard key={post.id} post={post} featured={index === 0} />
            ))}
          </section>
        ) : (
          <section className="rounded-2xl border border-dashed border-[#cbd2c9] bg-white/50 px-7 py-16 text-center">
            <p className="text-xs font-semibold tracking-[0.16em] text-[#527462] uppercase">The first page is still blank</p>
            <h2 className="mt-4 font-serif text-3xl italic text-[#46594e]">A little room for what comes next.</h2>
            <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[#69736b]">Published writing will find its place here.</p>
          </section>
        )}

        <footer className="mt-16 flex items-center justify-between border-t border-[#d8ddd5] pt-5 text-xs text-[#78817a]">
          <span>Fieldnotes</span>
          <span>Made for considered reading</span>
        </footer>
      </div>
    </main>
  )
}

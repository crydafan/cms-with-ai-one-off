import type { Metadata } from "next"

import { DraftEditor } from "@/components/draft-editor"

export const metadata: Metadata = {
  title: "Writer's desk",
  robots: { index: false, follow: false },
}

export default function WritePage() {
  return <DraftEditor />
}

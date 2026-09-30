import Markdown from "react-markdown"
import rehypeSanitize from "rehype-sanitize"
import remarkGfm from "remark-gfm"

export function MarkdownContent({ content }: { content: string }) {
  return (
    <div className="article-prose">
      <Markdown skipHtml remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeSanitize]}>
        {content}
      </Markdown>
    </div>
  )
}

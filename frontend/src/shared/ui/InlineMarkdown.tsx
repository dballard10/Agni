import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface InlineMarkdownProps {
  content: string;
  className?: string;
}

export function InlineMarkdown({ content, className }: InlineMarkdownProps) {
  const markdownComponents = {
    p: ({ node, ...props }: any) => <span {...props} />,
    strong: ({ node, ...props }: any) => (
      <strong className="font-bold" {...props} />
    ),
    em: ({ node, ...props }: any) => <em className="italic" {...props} />,
    h1: ({ node, ...props }: any) => (
      <span className="font-bold text-lg" {...props} />
    ),
    h2: ({ node, ...props }: any) => (
      <span className="font-bold text-lg" {...props} />
    ),
    h3: ({ node, ...props }: any) => (
      <span className="font-bold text-lg" {...props} />
    ),
    h4: ({ node, ...props }: any) => (
      <span className="font-bold text-lg" {...props} />
    ),
    h5: ({ node, ...props }: any) => (
      <span className="font-bold text-lg" {...props} />
    ),
    h6: ({ node, ...props }: any) => (
      <span className="font-bold text-lg" {...props} />
    ),
  };

  return (
    <div className={className}>
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
        {content}
      </ReactMarkdown>
    </div>
  );
}



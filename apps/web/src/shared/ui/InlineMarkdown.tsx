import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface InlineMarkdownProps {
  content: string;
  className?: string;
}

type MdComponentProps = { node?: unknown } & React.HTMLAttributes<HTMLElement>;

export function InlineMarkdown({ content, className }: InlineMarkdownProps) {
  const markdownComponents = {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node omitted intentionally
    p: ({ node, ...props }: MdComponentProps) => <span {...props} />,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node omitted intentionally
    strong: ({ node, ...props }: MdComponentProps) => (
      <strong className="font-bold" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node omitted intentionally
    em: ({ node, ...props }: MdComponentProps) => (
      <em className="italic" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node omitted intentionally
    h1: ({ node, ...props }: MdComponentProps) => (
      <span className="font-bold text-lg" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node omitted intentionally
    h2: ({ node, ...props }: MdComponentProps) => (
      <span className="font-bold text-lg" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node omitted intentionally
    h3: ({ node, ...props }: MdComponentProps) => (
      <span className="font-bold text-lg" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node omitted intentionally
    h4: ({ node, ...props }: MdComponentProps) => (
      <span className="font-bold text-lg" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node omitted intentionally
    h5: ({ node, ...props }: MdComponentProps) => (
      <span className="font-bold text-lg" {...props} />
    ),
    // eslint-disable-next-line @typescript-eslint/no-unused-vars -- node omitted intentionally
    h6: ({ node, ...props }: MdComponentProps) => (
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



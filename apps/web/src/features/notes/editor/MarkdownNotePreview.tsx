import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface MarkdownNotePreviewProps {
  content: string;
  className?: string;
}

/**
 * Markdown preview component using CSS variables from index.css (--notes-*)
 * for centralized theming alongside LiveMarkdownEditor.
 */
export function MarkdownNotePreview({
  content,
  className = "",
}: MarkdownNotePreviewProps) {
  return (
    <div className={`prose prose-invert prose-slate max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          // Headings
          h1: ({ children }) => (
            <h1 className="text-2xl font-bold text-[color:var(--notes-fg-strong)] mb-4 mt-6 first:mt-0 no-underline border-b-0">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="text-xl font-semibold text-[color:var(--notes-fg-strong)] mb-3 mt-5 no-underline border-b-0">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="text-lg font-semibold text-[color:var(--notes-fg-heading-3)] mb-2 mt-4 no-underline border-b-0">
              {children}
            </h3>
          ),
          h4: ({ children }) => (
            <h4 className="text-base font-semibold text-[color:var(--notes-fg-heading-3)] mb-2 mt-3 no-underline border-b-0">
              {children}
            </h4>
          ),
          h5: ({ children }) => (
            <h5 className="text-sm font-semibold text-[color:var(--notes-fg)] mb-1 mt-2 no-underline border-b-0">
              {children}
            </h5>
          ),
          h6: ({ children }) => (
            <h6 className="text-sm font-medium text-[color:var(--notes-muted)] mb-1 mt-2 no-underline border-b-0">
              {children}
            </h6>
          ),

          // Paragraphs and text
          p: ({ children }) => (
            <p className="text-[color:var(--notes-fg)] leading-relaxed mb-3">{children}</p>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-[color:var(--notes-fg-strong)]">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="italic text-[color:var(--notes-fg)]">{children}</em>
          ),

          // Lists
          ul: ({ children }) => (
            <ul className="list-disc list-inside mb-3 space-y-1 text-[color:var(--notes-fg)]">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal list-inside mb-3 space-y-1 text-[color:var(--notes-fg)]">
              {children}
            </ol>
          ),
          li: ({ children, className }) => {
            // Handle task list items (GFM)
            const isTaskItem = className?.includes("task-list-item");
            return (
              <li
                className={`text-[color:var(--notes-fg)] ${
                  isTaskItem ? "list-none flex items-start gap-2" : ""
                }`}
              >
                {children}
              </li>
            );
          },

          // Task checkboxes (GFM)
          input: ({ checked, type }) => {
            if (type === "checkbox") {
              return (
                <input
                  type="checkbox"
                  checked={checked}
                  readOnly
                  className="mt-1 rounded border-[color:var(--notes-checkbox-border)] bg-[color:var(--notes-checkbox-bg)] accent-[color:var(--notes-checkbox-checked-bg)] focus:ring-0 cursor-default"
                />
              );
            }
            return null;
          },

          // Links (all use same accent, including wiki links)
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-[color:var(--notes-link)] hover:opacity-80 underline underline-offset-2 transition-opacity"
              target={href?.startsWith("http") ? "_blank" : undefined}
              rel={href?.startsWith("http") ? "noopener noreferrer" : undefined}
            >
              {children}
            </a>
          ),

          // Code
          code: ({ className, children }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <code className="block bg-[color:var(--notes-code-bg)] rounded-md p-4 text-sm font-mono text-[color:var(--notes-fg-heading-3)] overflow-x-auto">
                  {children}
                </code>
              );
            }
            return (
              <code className="bg-[color:var(--notes-code-bg)] px-1.5 py-0.5 rounded text-sm font-mono text-[color:var(--notes-code-inline)]">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="mb-3 overflow-x-auto">{children}</pre>
          ),

          // Blockquotes
          blockquote: ({ children }) => (
            <blockquote className="border-l-4 border-[color:var(--notes-border-soft)] pl-4 py-1 my-3 text-[color:var(--notes-muted)] italic">
              {children}
            </blockquote>
          ),

          // Horizontal rule
          hr: () => <hr className="border-[color:var(--notes-border)] my-6" />,

          // Tables (GFM)
          table: ({ children }) => (
            <div className="overflow-x-auto mb-4">
              <table className="w-full border-collapse text-sm">
                {children}
              </table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className="bg-[color:var(--notes-code-bg)]">{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className="border-b border-[color:var(--notes-border)]">{children}</tr>
          ),
          th: ({ children }) => (
            <th className="px-3 py-2 text-left font-semibold text-[color:var(--notes-fg-heading-3)]">
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 text-[color:var(--notes-fg)]">{children}</td>
          ),

          // Images
          img: ({ src, alt }) => (
            <img
              src={src}
              alt={alt}
              className="max-w-full h-auto rounded-md my-3"
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownNotePreview;

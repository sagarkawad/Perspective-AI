import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkBreaks from "remark-breaks";

function removeLatex(text: string): string {
  // Remove \boxed{...} (LaTeX boxed environment)
  text = text.replace(/\\boxed{([^}]*)}/g, "$1");
  // Remove $$...$$ (multiline/block LaTeX)
  text = text.replace(/\$\$[\s\S]*?\$\$/g, "");
  // Remove $...$ (inline LaTeX)
  text = text.replace(/\$[^$]*\$/g, "");
  return text;
}

function MarkdownRenderer({ content }: { content: string }) {
  const sanitizedContent = removeLatex(content);
  // Ensure numbered or bullet points appear on their own lines
  const formattedContent = sanitizedContent
    .replace(/(^|\s)(\d+\.\s+)/g, '$1\n$2')
    .replace(/(^|\s)([•\-]\s+)/g, '$1\n$2');
  return (
    <div className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkBreaks]}
        components={{
          p: ({ node, ...props }) => (
            <p style={{ marginBottom: "1rem" }} {...props} />
          ),
          h1: ({ node, ...props }) => (
            <h1
              style={{
                fontWeight: "bold",
                fontSize: "1.8rem",
                marginBottom: "1rem",
                marginTop: "1.5rem",
              }}
              {...props}
            />
          ),
          h2: ({ node, ...props }) => (
            <h2
              style={{
                fontWeight: "bold",
                fontSize: "1.5rem",
                marginBottom: "0.8rem",
                marginTop: "1.2rem",
              }}
              {...props}
            />
          ),
          h3: ({ node, ...props }) => (
            <h3
              style={{
                fontWeight: "bold",
                fontSize: "1.2rem",
                marginBottom: "0.6rem",
                marginTop: "1rem",
              }}
              {...props}
            />
          ),
          ul: ({ node, ...props }) => (
            <ul
              style={{
                marginBottom: "1rem",
                paddingLeft: "2rem",
                listStyle: "disc",
              }}
              {...props}
            />
          ),
          ol: ({ node, ...props }) => (
            <ol
              style={{
                marginBottom: "1rem",
                paddingLeft: "2rem",
                listStyle: "decimal",
              }}
              {...props}
            />
          ),
          li: ({ node, ...props }) => (
            <li style={{ marginBottom: "0.5rem" }} {...props} />
          ),
          blockquote: ({ node, ...props }) => (
            <blockquote
              style={{
                borderLeft: "4px solid #e5e7eb",
                paddingLeft: "1rem",
                marginLeft: "0",
                marginBottom: "1rem",
              }}
              {...props}
            />
          ),
        }}
      >
        {formattedContent}
      </ReactMarkdown>
    </div>
  );
}

export default MarkdownRenderer;

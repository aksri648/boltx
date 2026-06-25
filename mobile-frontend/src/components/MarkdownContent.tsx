import ReactMarkdown from 'react-markdown';
import rehypeHighlight from 'rehype-highlight';
import { Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { cn } from '~/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
      const textarea = document.createElement('textarea');
      textarea.value = text;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={cn(
        'absolute top-2 right-2 flex items-center gap-1 px-2 py-1 rounded-md text-[10px] font-medium transition-all min-h-0 min-w-0',
        copied
          ? 'bg-success/20 text-success'
          : 'bg-background/80 text-muted-foreground hover:text-foreground hover:bg-background'
      )}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {copied ? 'Copied' : 'Copy'}
    </button>
  );
}

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  return (
    <div className={cn('markdown-body', className)}>
      <ReactMarkdown
        rehypePlugins={[rehypeHighlight]}
        components={{
          pre({ children, ...props }) {
            return (
              <div className="relative group">
                <pre {...props}>{children}</pre>
                <CopyButton text={extractText(children)} />
              </div>
            );
          },
          code({ className: codeClassName, children, ...props }) {
            const match = /language-(\w+)/.exec(codeClassName || '');
            if (match) {
              return (
                <code className={codeClassName} {...props}>
                  {children}
                </code>
              );
            }
            return (
              <code className="inline-code" {...props}>
                {children}
              </code>
            );
          },
          a({ children, href, ...props }) {
            return (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:text-primary/80 underline underline-offset-2 transition-colors"
                {...props}
              >
                {children}
              </a>
            );
          },
          ul({ children, ...props }) {
            return (
              <ul className="list-disc list-inside space-y-1 marker:text-primary/60" {...props}>
                {children}
              </ul>
            );
          },
          ol({ children, ...props }) {
            return (
              <ol className="list-decimal list-inside space-y-1 marker:text-primary/60" {...props}>
                {children}
              </ol>
            );
          },
          li({ children, ...props }) {
            return (
              <li className="text-foreground/90" {...props}>
                {children}
              </li>
            );
          },
          h1({ children, ...props }) {
            return <h1 className="text-lg font-bold text-foreground mt-4 mb-2" {...props}>{children}</h1>;
          },
          h2({ children, ...props }) {
            return <h2 className="text-base font-bold text-foreground mt-3 mb-1.5" {...props}>{children}</h2>;
          },
          h3({ children, ...props }) {
            return <h3 className="text-sm font-bold text-foreground mt-2 mb-1" {...props}>{children}</h3>;
          },
          p({ children, ...props }) {
            return <p className="text-foreground/90 leading-relaxed mb-2 last:mb-0" {...props}>{children}</p>;
          },
          blockquote({ children, ...props }) {
            return (
              <blockquote
                className="border-l-3 border-primary/40 pl-3 my-2 text-foreground/70 italic"
                {...props}
              >
                {children}
              </blockquote>
            );
          },
          hr(props) {
            return <hr className="border-border my-3" {...props} />;
          },
          table({ children, ...props }) {
            return (
              <div className="overflow-x-auto my-2 rounded-lg border border-border">
                <table className="w-full text-xs" {...props}>
                  {children}
                </table>
              </div>
            );
          },
          th({ children, ...props }) {
            return (
              <th className="bg-surface px-3 py-2 text-left font-semibold text-foreground border-b border-border" {...props}>
                {children}
              </th>
            );
          },
          td({ children, ...props }) {
            return (
              <td className="px-3 py-1.5 text-foreground/80 border-b border-border/50" {...props}>
                {children}
              </td>
            );
          },
          strong({ children, ...props }) {
            return <strong className="font-bold text-foreground" {...props}>{children}</strong>;
          },
          em({ children, ...props }) {
            return <em className="italic text-foreground/80" {...props}>{children}</em>;
          },
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

// Extract text content from React children for copy functionality
function extractText(children: React.ReactNode): string {
  if (typeof children === 'string') return children;
  if (typeof children === 'number') return String(children);
  if (Array.isArray(children)) return children.map(extractText).join('');
  if (children && typeof children === 'object' && 'props' in children) {
    const el = children as { props: { children?: React.ReactNode } };
    return extractText(el.props.children);
  }
  return '';
}

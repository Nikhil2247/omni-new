import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { cn } from '@/lib/utils'

interface ChatbotMarkdownProps {
  content: string
  variant: 'user' | 'bot'
  className?: string
}

function normalizeChatMarkdown(content: string): string {
  if (!content) return ''

  const normalized = content.replace(/\r\n?/g, '\n')

  if (!normalized.includes('•')) {
    return normalized
  }

  // Convert backend bullet symbol output into proper markdown list items.
  return normalized
    .replace(/:\s*•\s*/g, ':\n\n- ')
    .replace(/\s+•\s*/g, '\n- ')
}

export function ChatbotMarkdown({ content, variant, className }: ChatbotMarkdownProps) {
  const isUser = variant === 'user'
  const markdown = normalizeChatMarkdown(content)

  return (
    <div
      className={cn(
        'max-w-none text-sm leading-relaxed',
        isUser ? 'text-primary-foreground' : 'text-foreground',
        className,
      )}
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
          ul: ({ children }) => <ul className="mb-2 list-disc pl-5 last:mb-0">{children}</ul>,
          ol: ({ children }) => <ol className="mb-2 list-decimal pl-5 last:mb-0">{children}</ol>,
          li: ({ children }) => <li className="mb-0.5">{children}</li>,
          h1: ({ children }) => <h1 className="mb-2 text-base font-semibold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-2 text-sm font-semibold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-1 text-sm font-semibold">{children}</h3>,
          code: ({ children, className: codeClass }) => {
            const isBlock = Boolean(codeClass)
            if (isBlock) {
              return (
                <code className="block overflow-x-auto rounded-md bg-background/20 px-2 py-1 text-xs">
                  {children}
                </code>
              )
            }

            return (
              <code className="rounded bg-background/20 px-1 py-0.5 text-[12px]">{children}</code>
            )
          },
          a: ({ children, href }) => (
            <a
              href={href}
              target="_blank"
              rel="noreferrer"
              className={cn(
                'underline underline-offset-2',
                isUser ? 'text-primary-foreground/90' : 'text-primary',
              )}
            >
              {children}
            </a>
          ),
          blockquote: ({ children }) => (
            <blockquote className="mb-2 border-l-2 border-border/70 pl-3 italic">{children}</blockquote>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  )
}

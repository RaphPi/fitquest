import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useTranslation } from 'react-i18next';
import { slugify } from '@/lib/utils';
import DocImage from './DocImage';

interface MarkdownDocsProps {
  content: string;
}

export default function MarkdownDocs({ content }: MarkdownDocsProps) {
  const { t } = useTranslation();

  return (
    <div className="rounded-xl border border-border bg-card p-5 md:p-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h2: ({ children }) => {
            const text = typeof children === 'string' ? children : '';
            return (
              <h2
                id={slugify(text)}
                className="font-display text-xl font-bold text-foreground mt-8 first:mt-0 mb-3 border-b border-border pb-2 scroll-mt-4"
              >
                {children}
              </h2>
            );
          },
          h3: ({ children }) => (
            <h3 className="font-display text-base font-bold text-primary-soft mt-5 mb-2">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed mb-3 text-[0.9rem] text-foreground">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="list-disc pl-5 space-y-1 mb-3 text-[0.9rem] text-foreground">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="list-decimal pl-5 space-y-1 mb-3 text-[0.9rem] text-foreground">
              {children}
            </ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed">{children}</li>
          ),
          code: ({ children, className }) => {
            if (className?.startsWith('language-')) {
              return <code className={`${className} text-sm font-mono`}>{children}</code>;
            }
            return (
              <code className="bg-card-shield text-primary-soft px-1 py-0.5 rounded text-[0.85em] font-mono">
                {children}
              </code>
            );
          },
          pre: ({ children }) => (
            <pre className="bg-card-shield rounded-lg p-4 overflow-x-auto mb-3 text-sm font-mono text-foreground">
              {children}
            </pre>
          ),
          blockquote: ({ children }) => (
            <blockquote
              className="pl-4 text-muted-foreground italic my-3 border-l-4"
              style={{ borderColor: 'rgba(99,102,241,0.5)' }}
            >
              {children}
            </blockquote>
          ),
          hr: () => <hr className="border-border my-6" />,
          strong: ({ children }) => (
            <strong className="font-bold text-foreground">{children}</strong>
          ),
          a: ({ children, href }) => (
            <a
              href={href}
              className="text-primary underline underline-offset-2 hover:text-primary-soft transition-colors"
              target={href?.startsWith('http') ? '_blank' : undefined}
              rel={href?.startsWith('http') ? 'noopener noreferrer' : undefined}
            >
              {children}
            </a>
          ),
          img: ({ src, alt }) => (
            <DocImage src={src ?? ''} alt={alt ?? t('help.screenshotAlt')} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}

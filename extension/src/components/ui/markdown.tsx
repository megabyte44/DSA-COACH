import { Fragment, type ReactNode } from 'react';
import { cn } from '../../lib/utils';

type ListItem = { text: string; sub: string[] };
type Block =
  | { type: 'code'; text: string }
  | { type: 'heading'; text: string }
  | { type: 'p'; text: string }
  | { type: 'ol' | 'ul'; items: ListItem[] };

/** Renders the small set of markdown the coach's AI explanations actually use
 * — headings, bold, inline code, fenced code blocks, and lists (including the
 * "1. step\n- detail" pattern GPT writes, where the dash is a sub-bullet of
 * the numbered step above it, not a sibling list item).
 *
 * No HTML injection: every node is built as React elements, never
 * dangerouslySetInnerHTML, since this text comes from an LLM. */
export function Markdown({ text, className }: { text: string; className?: string }) {
  const blocks = classify(text);
  return (
    <div className={cn('flex flex-col gap-2', className)}>
      {blocks.map((b, i) => <Fragment key={i}>{renderBlock(b)}</Fragment>)}
    </div>
  );
}

function classify(text: string): Block[] {
  const blocks: Block[] = [];
  const codeFence = /```(\w*)\n?([\s\S]*?)```/g;
  let last = 0;
  let match: RegExpExecArray | null;
  while ((match = codeFence.exec(text))) {
    if (match.index > last) blocks.push(...parseProse(text.slice(last, match.index)));
    blocks.push({ type: 'code', text: match[2].replace(/\n$/, '') });
    last = codeFence.lastIndex;
  }
  if (last < text.length) blocks.push(...parseProse(text.slice(last)));
  return blocks;
}

function parseProse(text: string): Block[] {
  const lines = text.split('\n');
  const nodes: Block[] = [];
  let current: { ordered: boolean; items: ListItem[] } | null = null;
  const flush = () => {
    if (current) { nodes.push({ type: current.ordered ? 'ol' : 'ul', items: current.items }); current = null; }
  };

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) { flush(); continue; }

    const heading = /^(#{1,4})\s+(.*)$/.exec(line);
    if (heading) { flush(); nodes.push({ type: 'heading', text: heading[2] }); continue; }

    const bullet = /^[-*]\s+(.*)$/.exec(line);
    if (bullet) {
      if (current && current.ordered && current.items.length) {
        current.items[current.items.length - 1].sub.push(bullet[1]);
      } else {
        if (!current || current.ordered) { flush(); current = { ordered: false, items: [] }; }
        current.items.push({ text: bullet[1], sub: [] });
      }
      continue;
    }

    const numbered = /^\d+[.)]\s+(.*)$/.exec(line);
    if (numbered) {
      if (!current || !current.ordered) { flush(); current = { ordered: true, items: [] }; }
      current.items.push({ text: numbered[1], sub: [] });
      continue;
    }

    flush();
    nodes.push({ type: 'p', text: line });
  }
  flush();
  return nodes;
}

function renderBlock(b: Block): ReactNode {
  switch (b.type) {
    case 'code':
      return (
        <pre className="overflow-x-auto rounded-lg border border-border-subtle bg-background p-3 text-[11px] leading-relaxed">
          <code className="font-mono text-foreground/90">{b.text}</code>
        </pre>
      );
    case 'heading':
      return (
        <p className="text-[11px] font-bold uppercase tracking-[0.05em] text-primary/90">{inline(b.text)}</p>
      );
    case 'p':
      return <p>{inline(b.text)}</p>;
    case 'ol':
    case 'ul': {
      const Tag = b.type;
      return (
        <Tag className={cn('flex flex-col gap-1 pl-4', b.type === 'ol' ? 'list-decimal' : 'list-disc')}>
          {b.items.map((item, i) => (
            <li key={i}>
              {inline(item.text)}
              {item.sub.length > 0 && (
                <ul className="mt-1 flex flex-col gap-1 pl-4 list-disc">
                  {item.sub.map((s, j) => <li key={j}>{inline(s)}</li>)}
                </ul>
              )}
            </li>
          ))}
        </Tag>
      );
    }
  }
}

/** Bold (**x**) and inline code (`x`) within a single line, safely tokenised. */
function inline(text: string): ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).filter(Boolean);
  return (
    <>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
        }
        if (part.startsWith('`') && part.endsWith('`')) {
          return (
            <code key={i} className="rounded bg-background px-1 py-0.5 font-mono text-[11px] text-primary">
              {part.slice(1, -1)}
            </code>
          );
        }
        return <Fragment key={i}>{part}</Fragment>;
      })}
    </>
  );
}

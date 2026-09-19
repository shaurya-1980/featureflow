/**
 * components/posts/MarkdownRenderer.jsx
 *
 * Lightweight, safe Markdown renderer without external dependencies.
 * Converts common Markdown primitives into styled React elements.
 */

import React from 'react';

/**
 * Safely sanitizes markdown links, preventing script execution schemes
 * (javascript:, data:, vbscript:) while allowing valid web links.
 */
const sanitizeHref = (rawUrl) => {
  if (!rawUrl) return '#';
  const trimmed = rawUrl.trim();
  // Block any javascript:, data:, vbscript: or encoded malicious protocols
  if (/^(javascript:|data:|vbscript:)/i.test(trimmed.replace(/\s+/g, ''))) {
    return '#';
  }
  if (/^https?:\/\//i.test(trimmed) || /^mailto:/i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.startsWith('/')) {
    return trimmed;
  }
  return `https://${trimmed}`;
};

/**
 * Parses inline markdown: bold, italic, code, links
 */
const parseInline = (text) => {
  if (!text) return null;

  // Split by inline patterns
  const tokens = [];
  let remaining = text;
  let key = 0;

  while (remaining.length > 0) {
    // Inline code: `code`
    const codeMatch = remaining.match(/^`([^`]+)`/);
    if (codeMatch) {
      tokens.push(
        <code key={key++} style={styles.inlineCode}>
          {codeMatch[1]}
        </code>
      );
      remaining = remaining.slice(codeMatch[0].length);
      continue;
    }

    // Bold: **text** or __text__
    const boldMatch = remaining.match(/^(\*\*|__)(.*?)\1/);
    if (boldMatch) {
      tokens.push(
        <strong key={key++} style={styles.bold}>
          {boldMatch[2]}
        </strong>
      );
      remaining = remaining.slice(boldMatch[0].length);
      continue;
    }

    // Italic: *text* or _text_
    const italicMatch = remaining.match(/^(\*|_)(.*?)\1/);
    if (italicMatch) {
      tokens.push(
        <em key={key++} style={styles.italic}>
          {italicMatch[2]}
        </em>
      );
      remaining = remaining.slice(italicMatch[0].length);
      continue;
    }

    // Link: [label](url)
    const linkMatch = remaining.match(/^\[([^\]]+)\]\(([^)]+)\)/);
    if (linkMatch) {
      const safeHref = sanitizeHref(linkMatch[2]);
      tokens.push(
        <a
          key={key++}
          href={safeHref}
          target="_blank"
          rel="noopener noreferrer"
          style={styles.link}
        >
          {linkMatch[1]}
        </a>
      );
      remaining = remaining.slice(linkMatch[0].length);
      continue;
    }

    // Plain text until next token
    const nextSpecial = remaining.search(/[`*_\[]/);
    if (nextSpecial === -1) {
      tokens.push(remaining);
      break;
    } else if (nextSpecial === 0) {
      tokens.push(remaining[0]);
      remaining = remaining.slice(1);
    } else {
      tokens.push(remaining.slice(0, nextSpecial));
      remaining = remaining.slice(nextSpecial);
    }
  }

  return tokens;
};

export const MarkdownRenderer = ({ content = '', previewMode = false, maxChars = 180 }) => {
  if (!content) return null;

  if (previewMode && content.length > maxChars) {
    // Strip Markdown tokens before truncating to avoid raw syntax in previews
    // (e.g. "**bol" or "[li" appearing mid-token). A lightweight single-pass
    // strip removes the most common inline markers: bold, italic, code, links.
    const stripped = content
      .replace(/\*\*([^*]+)\*\*/g, '$1')   // bold **text**
      .replace(/__([^_]+)__/g, '$1')        // bold __text__
      .replace(/\*([^*]+)\*/g, '$1')        // italic *text*
      .replace(/_([^_]+)_/g, '$1')          // italic _text_
      .replace(/`([^`]+)`/g, '$1')          // inline code
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links
      .replace(/^#{1,3}\s+/gm, '')          // headings
      .replace(/^[>\*\-]\s+/gm, '')         // blockquotes / list markers
      .replace(/```[\s\S]*?```/g, '')        // fenced code blocks
      .trim();
    const truncated = stripped.slice(0, maxChars).trim() + '...';
    return <span style={styles.previewText}>{truncated}</span>;
  }

  const lines = content.split('\n');
  const elements = [];
  let inCodeBlock = false;
  let codeBlockLines = [];
  let listItems = [];

  const flushList = (key) => {
    if (listItems.length > 0) {
      elements.push(
        <ul key={`list-${key}`} style={styles.ul}>
          {listItems.map((item, idx) => (
            <li key={idx} style={styles.li}>
              {parseInline(item)}
            </li>
          ))}
        </ul>
      );
      listItems = [];
    }
  };

  lines.forEach((line, index) => {
    // Multi-line code block start/end ```
    if (line.trim().startsWith('```')) {
      if (inCodeBlock) {
        elements.push(
          <pre key={`code-${index}`} style={styles.codeBlock}>
            <code>{codeBlockLines.join('\n')}</code>
          </pre>
        );
        codeBlockLines = [];
        inCodeBlock = false;
      } else {
        flushList(index);
        inCodeBlock = true;
      }
      return;
    }

    if (inCodeBlock) {
      codeBlockLines.push(line);
      return;
    }

    // Unordered lists
    const listMatch = line.match(/^[\*\-]\s+(.*)$/);
    if (listMatch) {
      listItems.push(listMatch[1]);
      return;
    } else {
      flushList(index);
    }

    // Empty line
    if (!line.trim()) {
      return;
    }

    // Headings
    if (line.startsWith('### ')) {
      elements.push(
        <h3 key={index} style={styles.h3}>
          {parseInline(line.slice(4))}
        </h3>
      );
      return;
    }
    if (line.startsWith('## ')) {
      elements.push(
        <h2 key={index} style={styles.h2}>
          {parseInline(line.slice(3))}
        </h2>
      );
      return;
    }
    if (line.startsWith('# ')) {
      elements.push(
        <h1 key={index} style={styles.h1}>
          {parseInline(line.slice(2))}
        </h1>
      );
      return;
    }

    // Blockquote
    if (line.startsWith('> ')) {
      elements.push(
        <blockquote key={index} style={styles.blockquote}>
          {parseInline(line.slice(2))}
        </blockquote>
      );
      return;
    }

    // Regular paragraph
    elements.push(
      <p key={index} style={styles.p}>
        {parseInline(line)}
      </p>
    );
  });

  flushList('final');

  return <div style={styles.container}>{elements}</div>;
};

const styles = {
  container: {
    lineHeight: 1.6,
    color: 'var(--text-secondary)',
    fontSize: '0.95rem',
  },
  previewText: {
    color: 'var(--text-secondary)',
    fontSize: '0.925rem',
    lineHeight: 1.5,
  },
  h1: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: 'var(--text-primary)',
    marginTop: '0.75rem',
    marginBottom: '0.5rem',
  },
  h2: {
    fontSize: '1.15rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginTop: '0.65rem',
    marginBottom: '0.4rem',
  },
  h3: {
    fontSize: '1.05rem',
    fontWeight: 600,
    color: 'var(--text-primary)',
    marginTop: '0.5rem',
    marginBottom: '0.35rem',
  },
  p: {
    marginBottom: '0.6rem',
  },
  bold: {
    fontWeight: 600,
    color: 'var(--text-primary)',
  },
  italic: {
    fontStyle: 'italic',
  },
  inlineCode: {
    backgroundColor: 'var(--bg-subtle)',
    color: 'var(--text-primary)',
    padding: '0.15rem 0.35rem',
    borderRadius: '4px',
    fontSize: '0.875rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    border: '1px solid var(--border-subtle)',
  },
  // Code blocks intentionally use a fixed dark background/light text — this is
  // a standard code block aesthetic that applies equally in both themes.
  codeBlock: {
    backgroundColor: '#0f172a',
    color: '#f8fafc',
    padding: '0.85rem',
    borderRadius: '6px',
    overflowX: 'auto',
    fontSize: '0.875rem',
    fontFamily: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace',
    margin: '0.75rem 0',
  },
  blockquote: {
    borderLeft: '3px solid var(--color-brand)',
    margin: '0.6rem 0',
    paddingLeft: '0.85rem',
    color: 'var(--text-muted)',
    fontStyle: 'italic',
  },
  ul: {
    paddingLeft: '1.25rem',
    marginBottom: '0.6rem',
  },
  li: {
    marginBottom: '0.25rem',
  },
  link: {
    color: 'var(--color-brand)',
    textDecoration: 'underline',
  },
};

export default MarkdownRenderer;

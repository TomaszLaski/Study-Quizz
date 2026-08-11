import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { Components } from 'react-markdown';
import './AnswerMarkdown.css';

interface AnswerMarkdownProps {
  content: string;
}

function stripHtmlBlocks(text: string) {
  return text
    .replace(/<details>[\s\S]*?<\/details>/gi, '')
    .replace(/<[^>]+>/g, '')
    .trim();
}

/** Resolve markdown image paths (e.g. images/vdom1.png) against Vite base. */
function resolveImgSrc(src: string | undefined): string | undefined {
  if (!src) return src;
  if (/^(https?:|data:|blob:)/i.test(src)) return src;
  const base = import.meta.env.BASE_URL || '/';
  const path = src.replace(/^\.\//, '').replace(/^\//, '');
  return `${base}${path}`;
}

const components: Components = {
  img: ({ src, alt, ...rest }) => (
    <img src={resolveImgSrc(src)} alt={alt ?? ''} className="answer-md-img" {...rest} />
  ),
};

export default function AnswerMarkdown({ content }: AnswerMarkdownProps) {
  const cleaned = stripHtmlBlocks(content);

  return (
    <div className="answer-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>
        {cleaned}
      </ReactMarkdown>
    </div>
  );
}

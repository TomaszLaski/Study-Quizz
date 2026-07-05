import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
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

export default function AnswerMarkdown({ content }: AnswerMarkdownProps) {
  const cleaned = stripHtmlBlocks(content);

  return (
    <div className="answer-markdown">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{cleaned}</ReactMarkdown>
    </div>
  );
}

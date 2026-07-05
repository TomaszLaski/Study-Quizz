import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const README_URL =
  'https://raw.githubusercontent.com/sudheerj/reactjs-interview-questions/master/README.md';
const outputPath = path.join(__dirname, '../src/data/questions.json');

async function fetchReadme() {
  const localPath = path.join(__dirname, 'README.md');
  if (fs.existsSync(localPath)) {
    return fs.readFileSync(localPath, 'utf8');
  }

  const response = await fetch(README_URL);
  if (!response.ok) {
    throw new Error(`Failed to fetch README: ${response.status}`);
  }
  const text = await response.text();
  fs.writeFileSync(localPath, text, 'utf8');
  return text;
}

const QUESTION_RE = /^\s*\d+\.\s+###\s+(.+)$/;
const OPTION_LABELS = ['A', 'B', 'C'];
const MAX_OPTION_LENGTH = 200;

function parseQuestions(markdown) {
  const lines = markdown.split(/\r?\n/);
  const questions = [];
  let currentCategory = 'Ogólne';
  let current = null;

  const flush = () => {
    if (!current) return;
    current.answer = current.answer.trim();
    if (current.question && current.answer) {
      questions.push(current);
    }
    current = null;
  };

  for (const line of lines) {
    const categoryMatch = line.match(/^##\s+(.+)$/);
    if (categoryMatch && !line.startsWith('###')) {
      flush();
      const name = categoryMatch[1].trim();
      if (!name.toLowerCase().includes('table of contents')) {
        currentCategory = name;
      }
      continue;
    }

    const questionMatch = line.match(QUESTION_RE);
    if (questionMatch) {
      flush();
      current = {
        id: questions.length + 1,
        category: currentCategory,
        question: questionMatch[1].trim(),
        answer: '',
      };
      continue;
    }

    if (!current) continue;

    if (line.includes('**[⬆ Back to Top]')) {
      flush();
      continue;
    }

    current.answer += line + '\n';
  }

  flush();
  return questions;
}

function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function truncate(text, max = MAX_OPTION_LENGTH) {
  if (text.length <= max) return text;
  const slice = text.slice(0, max - 1);
  const lastSpace = slice.lastIndexOf(' ');
  return `${(lastSpace > 60 ? slice.slice(0, lastSpace) : slice).trim()}…`;
}

function toShortAnswer(answer) {
  const withoutDetails = answer.replace(/<details>[\s\S]*?<\/details>/gi, '');
  const plain = stripMarkdown(withoutDetails);
  if (!plain) return null;

  const bullet = withoutDetails.match(/^\s*[-*]\s+(.+)$/m);
  if (bullet) {
    const cleaned = stripMarkdown(bullet[1]);
    if (isValidOption(cleaned)) return truncate(cleaned);
  }

  const sentence = plain.match(/^(.+?[.!?])(?:\s|$)/);
  if (sentence && isValidOption(sentence[1])) {
    return truncate(sentence[1].trim());
  }

  const fallback = truncate(plain);
  return isValidOption(fallback) ? fallback : null;
}

function isValidOption(text) {
  if (!text) return false;
  if (text.length < 30) return false;
  if (text.split(/\s+/).length < 6) return false;
  if (/^(yes|no),/i.test(text)) return false;
  if (/\busing\s*\./i.test(text)) return false;
  if (/\busing\s+but\b/i.test(text)) return false;
  if (/\bwith\s+its\b.*\bwith\b/i.test(text)) return false;
  return true;
}

function seededRandom(seed) {
  let state = seed >>> 0;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}

function shuffle(items, rng) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(rng() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function uniqueTexts(texts) {
  const seen = new Set();
  return texts.filter((text) => {
    const key = text.toLowerCase();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildOptions(question, allQuestions, shortById) {
  const correct =
    shortById.get(question.id) ??
    truncate(stripMarkdown(question.answer)) ??
    `Poprawna odpowiedź dotyczy: ${question.question}`;
  const rng = seededRandom(question.id * 7919);

  const sameCategory = allQuestions
    .filter((q) => q.id !== question.id && q.category === question.category)
    .map((q) => shortById.get(q.id));

  const otherCategory = allQuestions
    .filter((q) => q.id !== question.id && q.category !== question.category)
    .map((q) => shortById.get(q.id));

  const pool = uniqueTexts(
    [...sameCategory, ...otherCategory].filter(
      (text) => text && text !== correct && isValidOption(text),
    ),
  );

  const shuffledPool = shuffle(pool, rng);
  const wrongAnswers = shuffledPool.slice(0, 2);

  while (wrongAnswers.length < 2) {
    wrongAnswers.push(`To nie jest poprawna odpowiedź na pytanie: „${question.question}”.`);
  }

  const options = shuffle(
    [
      { text: correct, correct: true },
      { text: wrongAnswers[0], correct: false },
      { text: wrongAnswers[1], correct: false },
    ],
    rng,
  ).map((option, index) => ({
    label: OPTION_LABELS[index],
    text: option.text,
    correct: option.correct,
  }));

  return options;
}

function attachOptions(questions) {
  const shortById = new Map(
    questions
      .map((q) => [q.id, toShortAnswer(q.answer)])
      .filter(([, text]) => text),
  );

  return questions.map((question) => ({
    ...question,
    options: buildOptions(question, questions, shortById),
  }));
}

const markdown = await fetchReadme();
const questions = attachOptions(parseQuestions(markdown));
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf8');
console.log(`Parsed ${questions.length} questions with options -> ${outputPath}`);

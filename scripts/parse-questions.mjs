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

// Optional hand-curated correct answers, keyed by question id. Use this for
// questions whose essence is a narrative/list that a first-paragraph summary
// cannot capture concisely (e.g. "history of React"). Anything not listed here
// falls back to the automatic summary.
function loadOverrides() {
  const overridePath = path.join(__dirname, 'shortAnswer-overrides.json');
  if (!fs.existsSync(overridePath)) return {};
  try {
    return JSON.parse(fs.readFileSync(overridePath, 'utf8'));
  } catch (err) {
    console.warn(`Could not parse shortAnswer-overrides.json: ${err.message}`);
    return {};
  }
}

const QUESTION_RE = /^\s*\d+\.\s+###\s+(.+)$/;
const OPTION_LABELS = ['A', 'B', 'C', 'D'];

// ---------------------------------------------------------------------------
// Parsing the README into raw question records
// ---------------------------------------------------------------------------

function parseQuestions(markdown) {
  const lines = markdown.split(/\r?\n/);
  const questions = [];
  let currentCategory = 'General';
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

// ---------------------------------------------------------------------------
// Markdown helpers
// ---------------------------------------------------------------------------

// Convert markdown prose to clean text. Crucially it KEEPS the content of
// inline code spans (`useState`, `dangerouslySetInnerHTML`, ...) — dropping
// them used to strip the very subject of an answer and produce fragments that
// read as incomplete. Fenced code blocks are removed (captured separately).
function stripMarkdown(text) {
  return text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<details>[\s\S]*?<\/details>/gi, ' ')
    .replace(/`([^`]+)`/g, '$1')
    // Strip real HTML but keep bare capitalized JSX component tags used as
    // content (e.g. <Switch>, <Route>, <React.Fragment>) — deleting them used
    // to remove the subject of an answer.
    .replace(/<(?![A-Z][\w.]*>)[^>]*>/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    .replace(/^#{1,6}\s+/gm, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/ ?\n ?/g, '\n')
    .trim();
}

const ABBREVIATIONS = /\b(?:i\.e|e\.g|etc|vs|Mr|Mrs|Dr|No|v\d|ES\d|IE\d)\.$/i;

// Split prose into complete sentences without breaking on common
// abbreviations (i.e., e.g., etc.).
function splitSentences(text) {
  const parts = text.split(/(?<=[.!?])\s+/);
  const sentences = [];
  for (const part of parts) {
    const prev = sentences[sentences.length - 1];
    if (prev && ABBREVIATIONS.test(prev)) {
      sentences[sentences.length - 1] = `${prev} ${part}`;
    } else {
      sentences.push(part);
    }
  }
  return sentences.map((s) => s.trim()).filter(Boolean);
}

function isValidOption(text) {
  if (!text) return false;
  if (text.length < 24) return false;
  if (text.split(/\s+/).length < 5) return false;
  // Must contain a verb-ish token so we never keep a dangling noun phrase.
  if (!/\b(is|are|was|were|be|can|will|should|must|allows?|lets?|provides?|returns?|uses?|makes?|helps?|means?|works?|does|do|has|have|refers?|represents?|enables?|creates?|renders?|needs?|requires?)\b/i.test(text)) {
    return false;
  }
  return true;
}

// ---------------------------------------------------------------------------
// Derived fields
// ---------------------------------------------------------------------------

const SHORT_TARGET = 360;
const SHORT_MAX_SENTENCES = 4;

// Compose text from whole sentences only, never cutting mid-thought and never
// appending an ellipsis. The first sentence is always kept in full; further
// sentences are added while they fit the length and sentence-count budget so
// the result reads as a self-contained summary rather than a lone fragment.
function truncateClean(text, max = SHORT_TARGET, maxSentences = Infinity) {
  const sentences = splitSentences(text.trim());
  if (!sentences.length) return text.trim();
  let out = sentences[0];
  for (let i = 1; i < sentences.length && i < maxSentences; i += 1) {
    if (`${out} ${sentences[i]}`.length <= max) out += ` ${sentences[i]}`;
    else break;
  }
  return out.trim();
}

// The intro prose of an answer: everything before the first list, table,
// heading or code block. Leading headings/blank lines are skipped.
function leadProse(answer) {
  const cleaned = answer
    .replace(/```[\s\S]*?```/g, '\n')
    .replace(/<details>[\s\S]*?<\/details>/gi, '\n');
  const lines = cleaned.split(/\r?\n/);
  const buf = [];

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      if (buf.length) break;
      continue;
    }
    if (/^#{1,6}\s/.test(line)) {
      if (buf.length) break;
      continue; // skip a leading section heading
    }
    if (/^([-*]|\d+\.)\s/.test(line) || line.startsWith('|')) break;
    if (/^<\/?[a-z]/i.test(line)) {
      if (buf.length) break;
      continue;
    }
    buf.push(line);
  }

  return stripMarkdown(buf.join(' '));
}

function summarizePoints(points, max = 5) {
  return points
    .slice(0, max)
    .map((p) => {
      // Keep only the label part: text before an em-dash/dash separator or the
      // first ": " clause, capped to a few words.
      const head = p.split(/\s+[—–-]\s+|:\s/)[0];
      const words = head.split(/\s+/);
      return (words.length > 7 ? words.slice(0, 7).join(' ') : head).replace(
        /[.:;,]+$/,
        '',
      );
    })
    .filter(Boolean);
}

// A sentence that merely announces an upcoming enumeration ("... in five
// steps.", "React follows three principles:", "Below are the advantages")
// carries no real content on its own and should be enriched with key points.
function isPointerLeadIn(sentence) {
  const s = sentence.trim();
  if (/:$/.test(s)) return true;
  if ((s.match(/[.!?]/g) || []).length > 1) return false; // already substantive
  const announcer =
    /\b(follows?|following|below|there (?:are|exist|is)|as follows|comprises?|consists?|includes?|two|three|four|five|six|seven|several|many|main|key|couple|list of|number of)\b/i;
  const noun =
    /\b(steps?|ways?|principles?|reasons?|types?|methods?|benefits?|advantages?|limitations?|differences?|features?|options?|rules?|phases?|approaches|properties|cases|components|directories|goals?|points?|packages|libraries|hooks|categories|conditions|guidelines|use cases)\b/i;
  return announcer.test(s) && noun.test(s);
}

// Join points as sentences, ensuring each ends with terminal punctuation so
// consecutive points don't run together.
function joinSentences(points) {
  return points
    .map((p) => {
      const t = p.trim();
      return /[.!?]$/.test(t) ? t : `${t}.`;
    })
    .join(' ');
}

// Trim dangling "For example, ..." / "such as ..." fragments left at the end
// when the intro runs straight into a code sample, and tidy trailing space.
function cleanupSummary(text) {
  const trimmed = text
    .replace(/\s*(?:For example|For instance|e\.g\.|such as)\b[^.!?]*$/i, '')
    .replace(/[\s,;:]+$/, '')
    .trim();
  // Only drop the trailing example if enough substance remains; otherwise the
  // example clause was the actual content — keep the original text.
  const base =
    trimmed.split(/\s+/).length >= 6 ? trimmed : text.replace(/[\s,;:]+$/, '').trim();
  return base.replace(/([^.!?])$/, '$1.');
}

function toShortAnswer(answer) {
  const lead = leadProse(answer);
  const points = extractKeyPoints(answer);

  if (lead) {
    let out = truncateClean(lead, SHORT_TARGET, SHORT_MAX_SENTENCES);
    // If the summary only announces a list ("... in five steps."), replace the
    // empty lead-in with the actual content so the correct option conveys the
    // answer instead of a pointer.
    if (points.length >= 2 && isPointerLeadIn(out)) {
      const labelLike = (p) => /\s—\s|:\s/.test(p) || p.split(/\s+/).length <= 6;
      const labelStyle =
        points.filter(labelLike).length >= Math.ceil(points.length / 2);
      if (labelStyle) {
        const labels = summarizePoints(points);
        if (labels.length) {
          out = `${out.replace(/[:.,;\s]*$/, '')}: ${labels.join(', ')}.`;
        }
      } else {
        // Points are full sentences — the list itself is the answer.
        out = truncateClean(joinSentences(points), SHORT_TARGET, SHORT_MAX_SENTENCES);
      }
    }
    out = cleanupSummary(out);
    if (isValidOption(out) || out.length >= 40) return out;
  }

  // Answer opens straight into a list/table: build from its key points.
  if (points.length >= 2) {
    return cleanupSummary(
      truncateClean(joinSentences(points), SHORT_TARGET, SHORT_MAX_SENTENCES),
    );
  }
  if (points.length === 1 && isValidOption(points[0])) return cleanupSummary(points[0]);

  const plain = stripMarkdown(answer);
  if (plain) {
    const first = cleanupSummary(truncateClean(plain, SHORT_TARGET));
    if (isValidOption(first) || first.length >= 40) return first;
  }
  return null;
}

function extractKeyPoints(answer) {
  const withoutCode = answer
    .replace(/```[\s\S]*?```/g, '')
    .replace(/<details>[\s\S]*?<\/details>/gi, '');
  const lines = withoutCode.split(/\r?\n/);
  const points = [];

  const skip = /^(for example|e\.g\.|i\.e\.|note|see |example\b)/i;

  const addPoint = (text) => {
    if (!text || text.length < 4) return;
    if (skip.test(text)) return;
    if (points.includes(text)) return;
    points.push(text);
  };

  // Pass 1: markdown list items.
  for (const raw of lines) {
    const bullet = raw.match(/^\s*(?:[-*]|\d+\.)\s+(.+)$/);
    if (!bullet) continue;
    let text = stripMarkdown(bullet[1]);
    if (!text) continue;
    // Turn a leading "Label:" prefix into "Label — " to keep it readable.
    text = text.replace(/^([A-Za-z][\w .()/+-]{0,44}):\s+/, '$1 — ');
    text = truncateClean(text, 170);
    if (text.length < 8) continue;
    addPoint(text);
    if (points.length >= 6) break;
  }

  // Pass 2: bold heading-style steps ("**1. Initial Render**", "**Reconciliation**")
  // used in several answers instead of markdown lists.
  if (points.length < 2) {
    for (const raw of lines) {
      const m = raw.match(/^\s*\*\*\s*(?:\d+\.\s*)?([^*]{3,60}?)\s*\*\*\s*[:.\-–—]?\s*(.*)$/);
      if (!m) continue;
      const label = stripMarkdown(m[1]).replace(/[:.\-–—\s]+$/, '').trim();
      const rest = truncateClean(stripMarkdown(m[2]).trim(), 140);
      const text = rest ? `${label} — ${rest}` : label;
      addPoint(truncateClean(text, 170));
      if (points.length >= 6) break;
    }
  }

  return points;
}

function extractCodeExamples(answer) {
  const examples = [];
  const re = /```([a-zA-Z0-9_-]*)\r?\n([\s\S]*?)```/g;
  let match;
  while ((match = re.exec(answer)) !== null) {
    const rawLang = (match[1] || '').toLowerCase();
    const code = match[2].replace(/\s+$/, '');
    if (!code.trim()) continue;
    const language = normalizeLanguage(rawLang);
    examples.push({ language, code });
    if (examples.length >= 4) break;
  }
  return examples;
}

function normalizeLanguage(lang) {
  if (!lang) return 'jsx';
  if (lang === 'jsx' || lang.startsWith('jsx')) return 'jsx';
  if (lang === 'js' || lang === 'javascript') return 'javascript';
  if (lang === 'ts' || lang === 'typescript') return 'typescript';
  if (lang === 'tsx') return 'tsx';
  if (lang === 'html') return 'html';
  if (lang === 'css') return 'css';
  if (lang === 'json') return 'json';
  if (lang === 'bash' || lang === 'console' || lang === 'shell' || lang === 'sh') return 'bash';
  return lang;
}

const TAG_DICTIONARY = [
  ['hooks', /\bhooks?\b|useState|useEffect|useRef|useMemo|useCallback|useReducer|useContext|useLayoutEffect|useImperativeHandle|useTransition|useId|useDeferredValue|useSyncExternalStore/i],
  ['state', /\bstate\b|setState/i],
  ['props', /\bprops?\b/i],
  ['components', /\bcomponents?\b/i],
  ['jsx', /\bjsx\b/i],
  ['virtual-dom', /virtual dom|reconciliation|diffing|fiber/i],
  ['lifecycle', /lifecycle|componentDid|componentWill|getDerivedState|getSnapshot/i],
  ['redux', /\bredux\b|reducer|dispatch|mapStateToProps|mapDispatchToProps|saga|thunk/i],
  ['context', /\bcontext\b|createContext|Provider|Consumer/i],
  ['refs', /\brefs?\b|forwardRef|createRef|useRef/i],
  ['router', /router|route|history|navigate/i],
  ['performance', /performance|memo|memoiz|windowing|re-?render|batch/i],
  ['ssr', /server-?side|ssr|hydrat|renderToString|renderToNodeStream/i],
  ['testing', /\btest|jest|jasmine|renderer|shallow render/i],
  ['forms', /\bform\b|formik|controlled|uncontrolled|input/i],
  ['error-handling', /error boundar|componentDidCatch|getDerivedStateFromError/i],
  ['typescript', /typescript|proptypes|flow\b|type check/i],
  ['react-native', /react native/i],
  ['styling', /styled-?components|css-?in-?js|inline style|className/i],
  ['events', /event handler|synthetic event|onclick|pointer event/i],
  ['portals', /portal|createPortal/i],
  ['hoc', /higher-?order component|\bhoc\b/i],
  ['render-props', /render props?/i],
  ['nextjs', /next\.?js/i],
  ['fundamentals', /what is react|major features|advantages of react|history/i],
];

function buildTags(question) {
  const haystack = `${question.question} ${question.answer}`;
  const tags = new Set();

  // Category-derived tag (kebab-case).
  const catTag = question.category
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  if (catTag && catTag !== 'miscellaneous' && catTag !== 'old-q-and-a') {
    tags.add(catTag);
  }

  for (const [tag, re] of TAG_DICTIONARY) {
    if (re.test(haystack)) tags.add(tag);
    if (tags.size >= 6) break;
  }

  if (tags.size === 0) tags.add('react');
  return [...tags].slice(0, 6);
}

function assessDifficulty(question) {
  const q = question.question.toLowerCase();
  const plainAnswer = stripMarkdown(question.answer);
  const answerLength = plainAnswer.length;
  const codeBlocks = (question.answer.match(/```/g) || []).length / 2;

  const hardSignals = /(internally|under the hood|algorithm|fiber|reconciliation|concurrent|hydrat|windowing|thrash|middleware|saga|imperativehandle|synchronous or asynchronous|behind the scenes|deep-?dive|batch)/i;
  const easySignals = /^(what is|what are|what does|why do we|is it |does react|can i|can you use|do i|do you|should i)/i;

  if (hardSignals.test(q) || hardSignals.test(plainAnswer.slice(0, 400))) {
    return 'hard';
  }
  // Definitional "what is/are ...?" questions stay easy/medium regardless of
  // how many code samples the answer happens to include.
  if (easySignals.test(q)) {
    return answerLength < 500 && codeBlocks <= 1 ? 'easy' : 'medium';
  }
  if (question.category === 'Old Q&A' && answerLength > 1200) {
    return 'hard';
  }
  if (answerLength > 1600 || codeBlocks >= 4) {
    return 'hard';
  }
  return 'medium';
}

function buildRelatedQuestions(question, allQuestions, tagsById) {
  const myTags = new Set(tagsById.get(question.id));
  const scored = [];

  for (const other of allQuestions) {
    if (other.id === question.id) continue;
    const otherTags = tagsById.get(other.id) || [];
    let shared = 0;
    for (const t of otherTags) {
      if (myTags.has(t)) shared += 1;
    }
    if (other.category === question.category) shared += 0.5;
    if (shared > 0) scored.push({ id: other.id, shared });
  }

  scored.sort((a, b) => b.shared - a.shared || a.id - b.id);
  return scored.slice(0, 4).map((s) => s.id);
}

// ---------------------------------------------------------------------------
// Options (A/B/C/D) — one correct, three topically-related distractors
// ---------------------------------------------------------------------------

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

const NEEDED_DISTRACTORS = 3;

function buildOptions(question, allQuestions, shortById, tagsById) {
  const correct =
    shortById.get(question.id) ??
    truncateClean(stripMarkdown(question.answer)) ??
    `The correct answer relates to: ${question.question}`;
  const rng = seededRandom(question.id * 7919);

  const myTags = new Set(tagsById.get(question.id));

  const scoreOf = (q) => {
    let score = 0;
    if (q.category === question.category) score += 2;
    for (const t of tagsById.get(q.id) || []) {
      if (myTags.has(t)) score += 1;
    }
    return score;
  };

  // Prefer topically-related questions (same category / shared tags) as
  // distractors — they read as plausible alternatives instead of noise.
  const candidates = allQuestions
    .filter((q) => q.id !== question.id)
    .map((q) => ({ text: shortById.get(q.id), score: scoreOf(q) }))
    .filter((c) => c.text && c.text !== correct && isValidOption(c.text))
    .sort((a, b) => b.score - a.score);

  // Keep some randomness among equally-related candidates so the same
  // distractor set is deterministic per-question but not monotonous.
  const topRelated = shuffle(
    candidates.filter((c) => c.score > 0),
    rng,
  );
  const rest = shuffle(
    candidates.filter((c) => c.score === 0),
    rng,
  );

  const pool = uniqueTexts([...topRelated, ...rest].map((c) => c.text));
  const wrongAnswers = pool.slice(0, NEEDED_DISTRACTORS);

  while (wrongAnswers.length < NEEDED_DISTRACTORS) {
    wrongAnswers.push(
      `This statement does not correctly answer: “${question.question}”.`,
    );
  }

  const options = shuffle(
    [
      { text: correct, correct: true },
      ...wrongAnswers.map((text) => ({ text, correct: false })),
    ],
    rng,
  ).map((option, index) => ({
    label: OPTION_LABELS[index],
    text: option.text,
    correct: option.correct,
  }));

  return options;
}

// ---------------------------------------------------------------------------
// Assemble the enriched schema
// ---------------------------------------------------------------------------

function enrich(questions) {
  const shortById = new Map(
    questions
      .map((q) => [q.id, toShortAnswer(q.answer)])
      .filter(([, text]) => text),
  );

  // Curated correct answers win over the automatic summary for both the
  // `shortAnswer` field and the correct quiz option.
  const validIds = new Set(questions.map((q) => q.id));
  for (const [id, text] of Object.entries(loadOverrides())) {
    const numericId = Number(id);
    if (validIds.has(numericId) && typeof text === 'string' && text.trim()) {
      shortById.set(numericId, text.trim());
    }
  }

  const tagsById = new Map(questions.map((q) => [q.id, buildTags(q)]));

  return questions.map((question) => ({
    id: question.id,
    category: question.category,
    difficulty: assessDifficulty(question),
    question: question.question,
    shortAnswer: shortById.get(question.id) ?? null,
    answer: question.answer,
    keyPoints: extractKeyPoints(question.answer),
    codeExamples: extractCodeExamples(question.answer),
    tags: tagsById.get(question.id),
    relatedQuestions: buildRelatedQuestions(question, questions, tagsById),
    options: buildOptions(question, questions, shortById, tagsById),
  }));
}

const markdown = await fetchReadme();
const questions = enrich(parseQuestions(markdown));
fs.mkdirSync(path.dirname(outputPath), { recursive: true });
fs.writeFileSync(outputPath, JSON.stringify(questions, null, 2), 'utf8');
console.log(`Parsed ${questions.length} questions (enriched schema) -> ${outputPath}`);

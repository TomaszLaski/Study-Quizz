import { useEffect, useState, type FormEvent } from 'react';
import type { CourseMeta, Question } from '../types';
import AnswerMarkdown from './AnswerMarkdown';
import './QuizScreen.css';

/** Decide which review sections to show so keypoints ≠ explanation. */
function getReviewDisplay(answer: string, keyPoints: string[]) {
  const points = keyPoints.map((p) => p.trim()).filter(Boolean);
  const ans = answer.trim();

  if (points.length === 0) {
    return { showKeyPoints: false, showAnswer: Boolean(ans), answerContent: ans };
  }
  if (!ans) {
    return { showKeyPoints: true, showAnswer: false, answerContent: '' };
  }

  const nAns = ans.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim().toLowerCase();
  const nPoints = points.map((p) => p.replace(/\s+/g, ' ').trim().toLowerCase());
  const pointsLen = nPoints.reduce((n, p) => n + p.length, 0);
  const allEmbedded = nPoints.every((p) => p.length > 0 && nAns.includes(p));

  // Strip embedded keypoints to see what explanation uniquely adds
  let unique = nAns;
  for (const p of nPoints) {
    unique = unique.replace(p, ' ');
  }
  unique = unique.replace(/\s+/g, ' ').trim();
  // Ignore leftover boilerplate like "poprawna odpowiedź: a."
  unique = unique
    .replace(/poprawna odpowied[źz]:\s*[abc]\.?/gi, '')
    .replace(/correct answer:\s*[abc]\.?/gi, '')
    .replace(/odpowied[źz]:\s*[abc]\.?/gi, '')
    .replace(/\s+/g, ' ')
    .trim();

  const uniqueAddsValue = unique.length > 50;

  if (!allEmbedded || uniqueAddsValue || nAns.length > pointsLen + 80) {
    return { showKeyPoints: true, showAnswer: true, answerContent: ans };
  }

  // Near-duplicate: keep the scannable checklist only
  return { showKeyPoints: true, showAnswer: false, answerContent: '' };
}

interface QuizScreenProps {
  questions: Question[];
  initialIndex: number;
  course: CourseMeta;
  difficultIds: number[];
  passedIds: number[];
  onToggleDifficult: (id: number) => void;
  onPass: (id: number) => void;
  onProgress: (id: number) => void;
  onExit: () => void;
}

export default function QuizScreen({
  questions,
  initialIndex,
  course,
  difficultIds,
  passedIds,
  onToggleDifficult,
  onPass,
  onProgress,
  onExit,
}: QuizScreenProps) {
  const safeInitial = Math.max(0, Math.min(initialIndex, Math.max(0, questions.length - 1)));
  const [index, setIndex] = useState(safeInitial);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [jumpValue, setJumpValue] = useState('');
  const [dragValue, setDragValue] = useState<number | null>(null);

  const current = questions[index];
  const total = questions.length;
  const displayIndex = dragValue != null ? dragValue - 1 : index;
  const progress = total > 1 ? (displayIndex / (total - 1)) * 100 : 100;
  const isDifficult = difficultIds.includes(current.id);
  const isPassed = passedIds.includes(current.id);
  const isJsm = course.id === 'jsm';
  const isPatterns = course.id === 'patterns';
  const isPl = isJsm || isPatterns;
  const unknownKey = Boolean(current.correctUnknown);
  const hasOfficialCorrect = current.options.some((o) => o.correct);
  const review = getReviewDisplay(current.answer, current.keyPoints);

  useEffect(() => {
    onProgress(current.id);
  }, [current.id, onProgress]);

  const goTo = (next: number) => {
    setIndex(Math.max(0, Math.min(next, total - 1)));
    setSelectedLabel(null);
    setChecked(false);
  };

  const handleCheck = () => {
    if (!selectedLabel) return;
    setChecked(true);
    if (hasOfficialCorrect) {
      const isCorrect = current.options.find((o) => o.label === selectedLabel)?.correct;
      if (isCorrect) onPass(current.id);
    }
  };

  const markMastered = () => {
    onPass(current.id);
  };

  const commitDrag = () => {
    if (dragValue == null) return;
    goTo(dragValue - 1);
    setDragValue(null);
  };

  const handleJump = (event: FormEvent) => {
    event.preventDefault();
    const n = Number.parseInt(jumpValue, 10);
    if (!Number.isNaN(n) && n >= 1 && n <= total) {
      goTo(n - 1);
      setJumpValue('');
    }
  };

  const getOptionClass = (label: string, isCorrect: boolean) => {
    const classes = ['option-row'];
    if (!checked) {
      if (selectedLabel === label) classes.push('is-selected');
      return classes.join(' ');
    }

    if (unknownKey || !hasOfficialCorrect) {
      if (selectedLabel === label) classes.push('is-selected');
      return classes.join(' ');
    }

    if (isCorrect) classes.push('is-correct');
    else if (selectedLabel === label) classes.push('is-wrong');
    return classes.join(' ');
  };

  const selectedIsCorrect =
    selectedLabel != null &&
    hasOfficialCorrect &&
    Boolean(current.options.find((o) => o.label === selectedLabel)?.correct);

  return (
    <div className="quiz-page">
      <div className="quiz-card">
        <header className="quiz-header">
          <div className="quiz-meta">
            <div className="meta-item">
              <span className="meta-label">{isPl ? 'Zakres' : 'Category'}</span>
              <span className="meta-value">{current.category}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">{isPl ? 'Kurs' : 'Course'}</span>
              <span className="meta-value">{course.title}</span>
            </div>
            {isPassed && (
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <span className="meta-value passed-badge">
                  {isPl ? '✓ Opanowane' : '✓ Passed'}
                </span>
              </div>
            )}
          </div>
          <button type="button" className="btn-exit" onClick={onExit}>
            <span className="exit-icon">✕</span>
            {isPl ? 'ZAKOŃCZ NAUKĘ' : 'END SESSION'}
          </button>
        </header>

        <div className="quiz-body">
          <section className="quiz-main">
            <div className="question-panel">
              <div className="question-icon" aria-hidden="true">
                {course.icon}
              </div>
              <h1 className="question-text">{current.question}</h1>
              {current.figure && (
                <div
                  className={
                    Array.isArray(current.figure) && current.figure.length > 1
                      ? 'question-figures is-multi'
                      : 'question-figures'
                  }
                  aria-label="Rysunek do pytania"
                >
                  {(Array.isArray(current.figure) ? current.figure : [current.figure]).map(
                    (path, i) => {
                      const multi = Array.isArray(current.figure) && current.figure.length > 1;
                      const label = multi ? String.fromCharCode(65 + i) : null;
                      const src = `${import.meta.env.BASE_URL}${path}`;
                      return (
                        <figure key={path} className="question-figure">
                          <figcaption>{label ? `Rysunek ${label}` : 'Rysunek'}</figcaption>
                          <a href={src} target="_blank" rel="noopener noreferrer" title="Otwórz w pełnym rozmiarze">
                            <img src={src} alt={label ? `Rysunek ${label}` : 'Rysunek do pytania'} />
                          </a>
                        </figure>
                      );
                    },
                  )}
                </div>
              )}
              {current.needsReview && (
                <p className="figure-review-note" role="note">
                  Do weryfikacji: {current.needsReview}
                </p>
              )}
              {current.tags.length > 0 && (
                <ul className="tag-list" aria-label="Tags">
                  {current.tags.map((tag) => (
                    <li key={tag} className="tag-chip">
                      #{tag}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="options-list" role="listbox" aria-label="Answers">
              {current.options.map((option) => (
                <button
                  key={option.label}
                  type="button"
                  className={getOptionClass(option.label, option.correct)}
                  disabled={checked}
                  onClick={() => setSelectedLabel(option.label)}
                  role="option"
                  aria-selected={selectedLabel === option.label}
                >
                  <span className="option-label">{option.label}</span>
                  <span className="option-text">{option.text}</span>
                </button>
              ))}
            </div>

            {checked && hasOfficialCorrect && (
              <div className={`result-banner ${selectedIsCorrect ? 'is-correct' : 'is-wrong'}`}>
                {selectedIsCorrect
                  ? isPl
                    ? 'Dobrze! To poprawna odpowiedź.'
                    : 'Correct! That is the right answer.'
                  : isPl
                    ? 'Nie tym razem — porównaj z wyjaśnieniem poniżej.'
                    : 'Not this time — see the full explanation below.'}
              </div>
            )}

            {checked && (unknownKey || !hasOfficialCorrect) && (
              <div className="result-banner is-study">
                Wybrano odpowiedź <strong>{selectedLabel}</strong>. Arkusz PZŻ nie zawiera
                oficjalnego klucza — zweryfikuj z podręcznikiem / instruktorrem. Możesz oznaczyć
                pytanie jako opanowane.
              </div>
            )}

            {checked && review.showKeyPoints && (
              <div className="keypoints-panel">
                <h2>{isPl ? 'Najważniejsze punkty' : 'Key points'}</h2>
                <ul className="keypoints-list">
                  {current.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {checked && review.showAnswer && (
              <div className="answer-panel">
                <h2>{isPl ? 'Jak myśleć / wyjaśnienie' : 'Full explanation'}</h2>
                <AnswerMarkdown content={review.answerContent} />
              </div>
            )}
          </section>

          <aside className="quiz-sidebar">
            <div className="sidebar-progress">
              <span className="progress-label">
                {isPl ? 'Numer pytania' : 'Question number'}
              </span>
              <div className="progress-count">
                {displayIndex + 1}/{total}
              </div>
              <div className="progress-track">
                <span className="progress-edge">1</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                  <span className="progress-thumb" style={{ left: `${progress}%` }}>
                    {course.icon}
                  </span>
                  <input
                    type="range"
                    className="progress-range"
                    min={1}
                    max={total}
                    value={displayIndex + 1}
                    aria-label="Jump to question"
                    onChange={(e) => setDragValue(Number(e.target.value))}
                    onMouseUp={commitDrag}
                    onTouchEnd={commitDrag}
                    onKeyUp={commitDrag}
                    onBlur={commitDrag}
                  />
                </div>
                <span className="progress-edge">{total}</span>
              </div>
            </div>

            <form className="jump-form" onSubmit={handleJump}>
              <label className="jump-label" htmlFor="jump-input">
                {isPl ? 'Idź do pytania' : 'Go to question'}
              </label>
              <div className="jump-row">
                <input
                  id="jump-input"
                  className="jump-input"
                  type="number"
                  min={1}
                  max={total}
                  value={jumpValue}
                  onChange={(e) => setJumpValue(e.target.value)}
                  placeholder={`1–${total}`}
                />
                <button type="submit" className="btn-action jump-btn">
                  {isPl ? 'OK' : 'GO'}
                </button>
              </div>
            </form>

            <div className="sidebar-actions">
              <button
                type="button"
                className="btn-action"
                disabled={!selectedLabel || checked}
                onClick={handleCheck}
              >
                {isPl ? 'SPRAWDŹ ODPOWIEDŹ' : 'CHECK ANSWER'}
              </button>
              {isJsm && checked && (unknownKey || !hasOfficialCorrect) && !isPassed && (
                <button type="button" className="btn-action btn-mastered" onClick={markMastered}>
                  OZNACZ JAKO OPANOWANE
                </button>
              )}
              <button
                type="button"
                className={`btn-action ${isDifficult ? 'is-active' : ''}`}
                onClick={() => onToggleDifficult(current.id)}
              >
                {isDifficult
                  ? isPl
                    ? 'USUŃ Z TRUDNYCH'
                    : 'REMOVE FROM DIFFICULT'
                  : isPl
                    ? 'DODAJ DO TRUDNYCH'
                    : 'ADD TO DIFFICULT'}
              </button>
              <button
                type="button"
                className="btn-action"
                disabled={index >= total - 1}
                onClick={() => goTo(index + 1)}
              >
                {isPl ? 'NASTĘPNE PYTANIE →' : 'NEXT QUESTION →'}
              </button>
              <button
                type="button"
                className="btn-action"
                disabled={index <= 0}
                onClick={() => goTo(index - 1)}
              >
                {isPl ? '← POPRZEDNIE PYTANIE' : '← PREVIOUS QUESTION'}
              </button>
              <button
                type="button"
                className="btn-action btn-restart"
                disabled={index <= 0}
                onClick={() => goTo(0)}
              >
                {isPl ? '⟲ OD POCZĄTKU' : '⟲ START OVER'}
              </button>
            </div>

            <div className="sidebar-stats">
              {isPl ? 'Opanowane' : 'Passed'} {passedIds.length}
              {current.sourceNum != null ? ` · Nr ${current.sourceNum}` : ` · ID ${current.id}`}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

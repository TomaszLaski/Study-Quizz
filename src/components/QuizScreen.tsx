import { useEffect, useState, type FormEvent } from 'react';
import type { Question } from '../types';
import AnswerMarkdown from './AnswerMarkdown';
import './QuizScreen.css';

interface QuizScreenProps {
  questions: Question[];
  initialIndex: number;
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
  // While dragging the slider we only preview the target; navigation is
  // committed on release.
  const [dragValue, setDragValue] = useState<number | null>(null);

  const current = questions[index];
  const total = questions.length;
  const displayIndex = dragValue != null ? dragValue - 1 : index;
  const progress = total > 1 ? (displayIndex / (total - 1)) * 100 : 100;
  const isDifficult = difficultIds.includes(current.id);
  const isPassed = passedIds.includes(current.id);

  // Remember the last visited question so the session can be resumed later.
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
    const isCorrect = current.options.find((o) => o.label === selectedLabel)?.correct;
    if (isCorrect) onPass(current.id);
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

    if (isCorrect) classes.push('is-correct');
    else if (selectedLabel === label) classes.push('is-wrong');
    return classes.join(' ');
  };

  return (
    <div className="quiz-page">
      <div className="quiz-card">
        <header className="quiz-header">
          <div className="quiz-meta">
            <div className="meta-item">
              <span className="meta-label">Category</span>
              <span className="meta-value">{current.category}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Difficulty</span>
              <span className={`meta-value difficulty difficulty-${current.difficulty}`}>
                {current.difficulty}
              </span>
            </div>
            {isPassed && (
              <div className="meta-item">
                <span className="meta-label">Status</span>
                <span className="meta-value passed-badge">✓ Passed</span>
              </div>
            )}
          </div>
          <button type="button" className="btn-exit" onClick={onExit}>
            <span className="exit-icon">✕</span>
            END SESSION
          </button>
        </header>

        <div className="quiz-body">
          <section className="quiz-main">
            <div className="question-panel">
              <div className="question-icon" aria-hidden="true">
                ⚛️
              </div>
              <h1 className="question-text">{current.question}</h1>
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

            {checked && (
              <div className={`result-banner ${selectedLabel && current.options.find((o) => o.label === selectedLabel)?.correct ? 'is-correct' : 'is-wrong'}`}>
                {selectedLabel && current.options.find((o) => o.label === selectedLabel)?.correct
                  ? 'Correct! That is the right answer.'
                  : 'Not this time — see the full explanation below.'}
              </div>
            )}

            {checked && current.keyPoints.length > 0 && (
              <div className="keypoints-panel">
                <h2>Key points</h2>
                <ul className="keypoints-list">
                  {current.keyPoints.map((point, i) => (
                    <li key={i}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {checked && (
              <div className="answer-panel">
                <h2>Full explanation</h2>
                <AnswerMarkdown content={current.answer} />
              </div>
            )}
          </section>

          <aside className="quiz-sidebar">
            <div className="sidebar-progress">
              <span className="progress-label">Question number</span>
              <div className="progress-count">
                {displayIndex + 1}/{total}
              </div>
              <div className="progress-track">
                <span className="progress-edge">1</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                  <span className="progress-thumb" style={{ left: `${progress}%` }}>
                    ⚛️
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
                Go to question
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
                  GO
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
                CHECK ANSWER
              </button>
              <button
                type="button"
                className={`btn-action ${isDifficult ? 'is-active' : ''}`}
                onClick={() => onToggleDifficult(current.id)}
              >
                {isDifficult ? 'REMOVE FROM DIFFICULT' : 'ADD TO DIFFICULT'}
              </button>
              <button
                type="button"
                className="btn-action"
                disabled={index >= total - 1}
                onClick={() => goTo(index + 1)}
              >
                NEXT QUESTION →
              </button>
              <button
                type="button"
                className="btn-action"
                disabled={index <= 0}
                onClick={() => goTo(index - 1)}
              >
                ← PREVIOUS QUESTION
              </button>
              <button
                type="button"
                className="btn-action btn-restart"
                disabled={index <= 0}
                onClick={() => goTo(0)}
              >
                ⟲ START OVER
              </button>
            </div>

            <div className="sidebar-stats">
              Passed {passedIds.length} · Question ID {current.id}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}

import { useState } from 'react';
import type { Question } from '../types';
import AnswerMarkdown from './AnswerMarkdown';
import './QuizScreen.css';

interface QuizScreenProps {
  questions: Question[];
  initialIndex: number;
  difficultIds: number[];
  onToggleDifficult: (id: number) => void;
  onExit: () => void;
}

export default function QuizScreen({
  questions,
  initialIndex,
  difficultIds,
  onToggleDifficult,
  onExit,
}: QuizScreenProps) {
  const safeInitial = Math.max(0, Math.min(initialIndex, Math.max(0, questions.length - 1)));
  const [index, setIndex] = useState(safeInitial);
  const [selectedLabel, setSelectedLabel] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);

  const current = questions[index];
  const total = questions.length;
  const progress = total > 1 ? (index / (total - 1)) * 100 : 100;
  const isDifficult = difficultIds.includes(current.id);

  const goTo = (next: number) => {
    setIndex(Math.max(0, Math.min(next, total - 1)));
    setSelectedLabel(null);
    setChecked(false);
  };

  const handleCheck = () => {
    if (!selectedLabel) return;
    setChecked(true);
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
              <span className="meta-label">Kategoria</span>
              <span className="meta-value">{current.category}</span>
            </div>
            <div className="meta-item">
              <span className="meta-label">Tryb</span>
              <span className="meta-value">A/B/C</span>
            </div>
          </div>
          <button type="button" className="btn-exit" onClick={onExit}>
            <span className="exit-icon">✕</span>
            ZAKOŃCZ NAUKĘ
          </button>
        </header>

        <div className="quiz-body">
          <section className="quiz-main">
            <div className="question-panel">
              <div className="question-icon" aria-hidden="true">
                ⚛️
              </div>
              <h1 className="question-text">{current.question}</h1>
            </div>

            <div className="options-list" role="listbox" aria-label="Odpowiedzi">
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
                  ? 'Dobrze! To poprawna odpowiedź.'
                  : 'Nie tym razem — zobacz pełne wyjaśnienie poniżej.'}
              </div>
            )}

            {checked && (
              <div className="answer-panel">
                <h2>Pełne wyjaśnienie</h2>
                <AnswerMarkdown content={current.answer} />
              </div>
            )}
          </section>

          <aside className="quiz-sidebar">
            <div className="sidebar-progress">
              <span className="progress-label">Numer pytania</span>
              <div className="progress-count">
                {index + 1}/{total}
              </div>
              <div className="progress-track">
                <span className="progress-edge">1</span>
                <div className="progress-bar">
                  <div className="progress-fill" style={{ width: `${progress}%` }} />
                  <span className="progress-thumb" style={{ left: `${progress}%` }}>
                    ⚛️
                  </span>
                </div>
                <span className="progress-edge">{total}</span>
              </div>
            </div>

            <div className="sidebar-actions">
              <button
                type="button"
                className="btn-action"
                disabled={!selectedLabel || checked}
                onClick={handleCheck}
              >
                SPRAWDŹ ODPOWIEDŹ
              </button>
              <button
                type="button"
                className={`btn-action ${isDifficult ? 'is-active' : ''}`}
                onClick={() => onToggleDifficult(current.id)}
              >
                {isDifficult ? 'USUŃ Z TRUDNYCH' : 'DODAJ DO TRUDNYCH'}
              </button>
              <button
                type="button"
                className="btn-action"
                disabled={index >= total - 1}
                onClick={() => goTo(index + 1)}
              >
                NASTĘPNE PYTANIE →
              </button>
              <button
                type="button"
                className="btn-action"
                disabled={index <= 0}
                onClick={() => goTo(index - 1)}
              >
                ← POPRZEDNIE PYTANIE
              </button>
            </div>

            <div className="sidebar-footer">ID: {current.id}</div>
          </aside>
        </div>
      </div>
    </div>
  );
}

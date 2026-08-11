import { useState } from 'react';
import type { CourseMeta } from '../types';

interface HomeScreenProps {
  course: CourseMeta;
  totalCount: number;
  categories: [string, number][];
  difficultCount: number;
  passedCount: number;
  hasProgress: boolean;
  resumeNumber: number;
  requiresScope: boolean;
  onBack: () => void;
  onContinue: () => void;
  onStartOver: () => void;
  onStartCategory: (category: string) => void;
  onStartDifficult: () => void;
  onStartAllWithScope?: (scope: string | 'all') => void;
}

export default function HomeScreen({
  course,
  totalCount,
  categories,
  difficultCount,
  passedCount,
  hasProgress,
  resumeNumber,
  requiresScope,
  onBack,
  onContinue,
  onStartOver,
  onStartCategory,
  onStartDifficult,
  onStartAllWithScope,
}: HomeScreenProps) {
  const [selectedScope, setSelectedScope] = useState<string | 'all' | null>(
    requiresScope ? null : 'all',
  );
  const passedPercent = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;
  const isPl = course.id === 'jsm' || course.id === 'patterns';
  const isPatterns = course.id === 'patterns';
  const isReact = course.id === 'react';

  const scopeReady = !requiresScope || selectedScope != null;

  const startAll = () => {
    if (requiresScope) {
      if (!selectedScope || !onStartAllWithScope) return;
      onStartAllWithScope(selectedScope);
      return;
    }
    onStartOver();
  };

  const scopeHint = isPatterns
    ? 'Trening jak na rozmowie: wybierz zakres (rozpoznawanie, wzorce, klocki, architektura) albo wszystkie pytania.'
    : isReact
      ? 'Pick a category (Core React, Hooks, Redux, …) or study all questions.'
      : 'Egzamin JSM obejmuje kilka zakresów tematycznych. Wybierz jeden zakres albo wszystkie pytania.';

  const allScopesLabel = isReact ? 'All categories' : 'Wszystkie zakresy';
  const questionsWord = isReact ? 'questions' : 'pytań';
  const scopeTitle = isReact ? '1. Choose a category' : '1. Wybierz zakres';
  const startLabel = !selectedScope
    ? isReact
      ? 'Choose a category first'
      : 'Najpierw wybierz zakres'
    : isReact
      ? `2. Start learning${selectedScope === 'all' ? ' (all)' : ''}`
      : `2. Rozpocznij naukę${selectedScope === 'all' ? ' (wszystkie)' : ''}`;

  return (
    <div className="home-page">
      <div className="home-card">
        <button type="button" className="back-link" onClick={onBack}>
          ← Wybór kursu
        </button>

        <div className="home-hero">
          <div className="home-icon">{course.icon}</div>
          <h1>{course.title}</h1>
          <p>{course.subtitle}</p>
        </div>

        <div className="home-progress">
          <div className="home-progress-text">
            <span>{isPl ? 'Opanowane' : 'Passed'}</span>
            <strong>
              {passedCount} / {totalCount}
            </strong>
          </div>
          <div className="home-progress-track">
            <div className="home-progress-fill" style={{ width: `${passedPercent}%` }} />
          </div>
        </div>

        {requiresScope && (
          <div className={`scope-panel ${isPatterns || isReact ? 'scope-panel-patterns' : ''}`}>
            <h2>{scopeTitle}</h2>
            <p className="scope-hint">{scopeHint}</p>
            <div className="scope-list" role="listbox" aria-label={isReact ? 'Category' : 'Zakres tematyczny'}>
              <button
                type="button"
                role="option"
                aria-selected={selectedScope === 'all'}
                className={`scope-btn ${selectedScope === 'all' ? 'is-selected' : ''}`}
                onClick={() => setSelectedScope('all')}
              >
                <span className="scope-name">{allScopesLabel}</span>
                <span className="scope-count">
                  {totalCount} {questionsWord}
                </span>
              </button>
              {categories.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  role="option"
                  aria-selected={selectedScope === name}
                  className={`scope-btn ${selectedScope === name ? 'is-selected' : ''}`}
                  onClick={() => setSelectedScope(name)}
                >
                  <span className="scope-name">{name}</span>
                  <span className="scope-count">
                    {count} {questionsWord}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="home-actions">
          {requiresScope && (
            <button
              type="button"
              className="home-btn primary"
              disabled={!scopeReady}
              onClick={startAll}
            >
              {startLabel}
            </button>
          )}

          {!requiresScope && hasProgress && (
            <button type="button" className="home-btn primary" onClick={onContinue}>
              Continue — question {resumeNumber}
            </button>
          )}
          {!requiresScope && (
            <button
              type="button"
              className={`home-btn ${hasProgress ? 'secondary' : 'primary'}`}
              onClick={onStartOver}
            >
              {hasProgress
                ? 'Start over (from question 1)'
                : `Start learning — all questions (${totalCount})`}
            </button>
          )}

          <button
            type="button"
            className="home-btn secondary"
            disabled={difficultCount === 0}
            onClick={onStartDifficult}
          >
            {isPl
              ? `Powtórz trudne pytania (${difficultCount})`
              : `Review difficult questions (${difficultCount})`}
          </button>
        </div>

        {!requiresScope && (
          <div className="category-grid">
            <h2>Choose a category</h2>
            <div className="category-list">
              {categories.map(([name, count]) => (
                <button
                  key={name}
                  type="button"
                  className="category-btn"
                  onClick={() => onStartCategory(name)}
                >
                  <span className="category-name">{name}</span>
                  <span className="category-count">{count} questions</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {requiresScope && selectedScope && selectedScope !== 'all' && (
          <p className="scope-selected-note">
            {isReact ? 'Selected category: ' : 'Wybrany zakres: '}
            <strong>{selectedScope}</strong>
          </p>
        )}

        <footer className="home-credit">
          <p className="home-author">
            Autor:{' '}
            <a
              href="https://www.linkedin.com/in/tomasz-%C5%82aski-7888b2185/"
              target="_blank"
              rel="noopener noreferrer"
            >
              Tomasz Łaski
            </a>
          </p>
          {course.id === 'jsm' ? (
            <>
              Źródło: przykładowe pytania egzaminacyjne PZŻ (Jachtowy Sternik Morski) + klucz
              odpowiedzi. Po sprawdzeniu zobaczysz poprawną literę (podświetloną).
            </>
          ) : isPatterns ? (
            <>
                Na podstawie materiałów o wzorcach-komponentach i klockach budulcowych. Zasada: najpierw
              słowa-klucze z zadania (dowód), potem nazwa wzorca (wniosek). Skupienie na{' '}
              <strong>kiedy używać</strong>, rozpoznawaniu i różnicach między podobnymi wzorcami.
            </>
          ) : (
            <>
              Questions from{' '}
              <a
                href="https://github.com/sudheerj/reactjs-interview-questions"
                target="_blank"
                rel="noopener noreferrer"
              >
                sudheerj/reactjs-interview-questions
              </a>{' '}
              — MIT License.
            </>
          )}
        </footer>
      </div>
    </div>
  );
}

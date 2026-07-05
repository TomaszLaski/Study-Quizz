interface HomeScreenProps {
  totalCount: number;
  categories: [string, number][];
  difficultCount: number;
  passedCount: number;
  hasProgress: boolean;
  resumeNumber: number;
  onContinue: () => void;
  onStartOver: () => void;
  onStartCategory: (category: string) => void;
  onStartDifficult: () => void;
}

export default function HomeScreen({
  totalCount,
  categories,
  difficultCount,
  passedCount,
  hasProgress,
  resumeNumber,
  onContinue,
  onStartOver,
  onStartCategory,
  onStartDifficult,
}: HomeScreenProps) {
  const passedPercent = totalCount > 0 ? Math.round((passedCount / totalCount) * 100) : 0;

  return (
    <div className="home-page">
      <div className="home-card">
        <div className="home-hero">
          <div className="home-icon">⚛️</div>
          <h1>React Interview Quiz</h1>
        </div>

        <div className="home-progress">
          <div className="home-progress-text">
            <span>Passed</span>
            <strong>
              {passedCount} / {totalCount}
            </strong>
          </div>
          <div className="home-progress-track">
            <div className="home-progress-fill" style={{ width: `${passedPercent}%` }} />
          </div>
        </div>

        <div className="home-actions">
          {hasProgress && (
            <button type="button" className="home-btn primary" onClick={onContinue}>
              Continue — question {resumeNumber}
            </button>
          )}
          <button
            type="button"
            className={`home-btn ${hasProgress ? 'secondary' : 'primary'}`}
            onClick={onStartOver}
          >
            {hasProgress
              ? 'Start over (from question 1)'
              : `Start learning — all questions (${totalCount})`}
          </button>
          <button
            type="button"
            className="home-btn secondary"
            disabled={difficultCount === 0}
            onClick={onStartDifficult}
          >
            Review difficult questions ({difficultCount})
          </button>
        </div>

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

        <footer className="home-credit">
          Questions from{' '}
          <a
            href="https://github.com/sudheerj/reactjs-interview-questions"
            target="_blank"
            rel="noopener noreferrer"
          >
            sudheerj/reactjs-interview-questions
          </a>{' '}
          — MIT License.
        </footer>
      </div>
    </div>
  );
}

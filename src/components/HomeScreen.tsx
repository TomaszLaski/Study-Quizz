interface HomeScreenProps {
  totalCount: number;
  categories: [string, number][];
  difficultCount: number;
  onStartAll: () => void;
  onStartCategory: (category: string) => void;
  onStartDifficult: () => void;
}

export default function HomeScreen({
  totalCount,
  categories,
  difficultCount,
  onStartAll,
  onStartCategory,
  onStartDifficult,
}: HomeScreenProps) {
  return (
    <div className="home-page">
      <div className="home-card">
        <div className="home-hero">
          <div className="home-icon">⚛️</div>
          <h1>React Interview Quiz</h1>
        </div>

        <div className="home-actions">
          <button type="button" className="home-btn primary" onClick={onStartAll}>
            Rozpocznij naukę — wszystkie pytania ({totalCount})
          </button>
          <button
            type="button"
            className="home-btn secondary"
            disabled={difficultCount === 0}
            onClick={onStartDifficult}
          >
            Powtórz trudne pytania ({difficultCount})
          </button>
        </div>

        <div className="category-grid">
          <h2>Wybierz kategorię</h2>
          <div className="category-list">
            {categories.map(([name, count]) => (
              <button
                key={name}
                type="button"
                className="category-btn"
                onClick={() => onStartCategory(name)}
              >
                <span className="category-name">{name}</span>
                <span className="category-count">{count} pytań</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

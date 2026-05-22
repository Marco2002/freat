interface MenuPageProps {
  onPractice: () => void;
  onTheory: () => void;
}

export function MenuPage({ onPractice, onTheory }: MenuPageProps) {
  return (
    <div className="menu-page">
      <div className="menu-title">
        <h1>Guitar<br />Practice</h1>
        <p>Major scale · Key of C</p>
      </div>
      <div className="menu-buttons">
        <button className="primary-btn" onClick={onPractice}>
          Practice →
        </button>
        <button className="secondary-btn" onClick={onTheory}>
          Theory →
        </button>
      </div>
    </div>
  );
}

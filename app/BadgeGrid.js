export default function BadgeGrid({ badges, empty }) {
  if (!badges.length) {
    return <p className="muted">{empty}</p>;
  }

  return (
    <ul className="badge-grid">
      {badges.map((b) => (
        <li key={b.category} className={`badge-medal${b.level === "Expert" ? " is-expert" : ""}`}>
          <span className="badge-ribbon" aria-hidden="true" />
          <span className="badge-medal-ring" aria-hidden="true">
            <span className="badge-medal-core">
              <em>{b.rate}%</em>
            </span>
          </span>
          <div className="badge-medal-copy">
            <b>{b.category}</b>
            <strong>{b.level}</strong>
            <small>
              {b.won}/{b.total} settled
            </small>
          </div>
        </li>
      ))}
    </ul>
  );
}

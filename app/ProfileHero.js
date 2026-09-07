export default function ProfileHero({
  initials,
  kicker = "Trader profile",
  title,
  subtitle,
  extra,
  stats,
}) {
  return (
    <section className="profile-hero">
      <div className="profile-hero-top">
        <span className="profile-avatar" aria-hidden="true">
          {initials}
        </span>
        <div className="profile-id">
          <p className="home-kicker">{kicker}</p>
          <h1>{title}</h1>
          {subtitle ? <p className="profile-name">{subtitle}</p> : null}
          {extra}
        </div>
      </div>
      {stats?.length ? (
        <div className="profile-wallet" aria-label="Token balance">
          {stats.map((s) => (
            <article key={s.label} className={s.hl ? "hl" : ""}>
              <span>{s.label}</span>
              <b>{s.value}</b>
              {s.hint ? <small>{s.hint}</small> : null}
            </article>
          ))}
        </div>
      ) : null}
    </section>
  );
}

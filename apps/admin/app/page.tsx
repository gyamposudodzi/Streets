const panels = [
  "Creator approvals",
  "Disputes",
  "Moderation queue",
  "Held funds",
  "Audit logs"
];

export default function AdminHome() {
  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Streets Admin</p>
        <h1>Operations foundation</h1>
        <div className="grid">
          {panels.map((panel) => (
            <article key={panel} className="card">
              <h2>{panel}</h2>
              <p>Placeholder surface for Phase 0 planning.</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}

const panels = [
  "Creator approvals",
  "Users",
  "Listings",
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
        <p>
          Phase 1 admin priorities are account review, listing moderation, and visibility
          into early booking activity before payout automation exists.
        </p>
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

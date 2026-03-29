import type { CreatorSummary, Service } from "@streets/types";

const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:8000";

async function getMarketplaceData(): Promise<{
  creators: CreatorSummary[];
  services: Service[];
  isFallback: boolean;
}> {
  try {
    const [creatorsResponse, servicesResponse] = await Promise.all([
      fetch(`${apiBaseUrl}/api/v1/creators`, { cache: "no-store" }),
      fetch(`${apiBaseUrl}/api/v1/services`, { cache: "no-store" })
    ]);

    if (!creatorsResponse.ok || !servicesResponse.ok) {
      throw new Error("API request failed");
    }

    const [creators, services] = await Promise.all([
      creatorsResponse.json() as Promise<CreatorSummary[]>,
      servicesResponse.json() as Promise<Service[]>
    ]);

    return { creators, services, isFallback: false };
  } catch {
    return { creators: [], services: [], isFallback: true };
  }
}

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}

export default async function MarketplaceHome() {
  const { creators, services, isFallback } = await getMarketplaceData();

  return (
    <main className="page">
      <section className="hero">
        <p className="eyebrow">Streets</p>
        <h1>Marketplace foundation</h1>
        <p>
          Phase 1 now includes live creator and service discovery from the backend, with
          remote and in-person fulfillment carried through the same booking model.
        </p>
        <div className="stats">
          <article className="stat">
            <strong>{creators.length}</strong>
            <span>Creators surfaced</span>
          </article>
          <article className="stat">
            <strong>{services.length}</strong>
            <span>Active services</span>
          </article>
          <article className="stat">
            <strong>{isFallback ? "Offline" : "Live"}</strong>
            <span>Marketplace data mode</span>
          </article>
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Creators</p>
            <h2>Discovery surface</h2>
          </div>
          {isFallback ? (
            <p className="note">
              Backend unavailable. Start the API to load seeded marketplace data.
            </p>
          ) : null}
        </div>
        <div className="grid">
          {creators.length > 0 ? (
            creators.map((creator) => (
              <article key={creator.user_id} className="card">
                <h3>{creator.display_name}</h3>
                <p>{creator.service_region}</p>
                <p>
                  {creator.country} · {creator.verification_status}
                </p>
                <p>Rating {creator.average_rating.toFixed(1)}</p>
              </article>
            ))
          ) : (
            <article className="card">
              <h3>No creators loaded</h3>
              <p>The UI is ready to render real discovery data once the backend is running.</p>
            </article>
          )}
        </div>
      </section>

      <section className="panel">
        <div className="panelHeader">
          <div>
            <p className="eyebrow">Services</p>
            <h2>Bookable offerings</h2>
          </div>
        </div>
        <div className="grid">
          {services.length > 0 ? (
            services.map((service) => (
              <article key={service.id} className="card">
                <p className="badge">{service.fulfillment_type.replace("_", " ")}</p>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <p>
                  {service.category} · {service.duration_minutes} min
                </p>
                <p>{formatPrice(service.price, service.currency)}</p>
              </article>
            ))
          ) : (
            <article className="card">
              <h3>No services loaded</h3>
              <p>Once the API is live, seeded services will render here automatically.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}

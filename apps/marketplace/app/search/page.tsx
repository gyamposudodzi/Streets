import Link from "next/link";

import { listServices } from "@streets/api-client";

type SearchPageProps = {
  searchParams: Promise<{
    q?: string;
    creator?: string;
    category?: string;
    fulfillment?: string;
  }>;
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const params = await searchParams;
  const services = await listServices({
    q: params.q,
    creator_id: params.creator,
    category: params.category,
    fulfillment_type: params.fulfillment
  }).catch(() => []);

  return (
    <main className="page">
      <section className="panel">
        <p className="eyebrow">Search</p>
        <h1>Discover bookable services</h1>
        <p>
          Browse the current creator catalog across video, custom, chat, call, and
          in-person fulfillment paths.
        </p>
        <form className="filters" action="/search">
          <input
            className="input"
            type="search"
            name="q"
            placeholder="Search title or description"
            defaultValue={params.q ?? ""}
          />
          <select className="input" name="fulfillment" defaultValue={params.fulfillment ?? ""}>
            <option value="">All fulfillment types</option>
            <option value="video">Video</option>
            <option value="audio_call">Audio call</option>
            <option value="chat">Chat</option>
            <option value="custom_request">Custom request</option>
            <option value="in_person">In person</option>
          </select>
          <button className="button" type="submit">
            Search
          </button>
        </form>
        <div className="grid">
          {services.length > 0 ? (
            services.map((service) => (
              <article key={service.id} className="card">
                <p className="badge">{service.fulfillment_type.replace("_", " ")}</p>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
                <p>
                  {service.category} - {service.duration_minutes} min
                </p>
                <p>{formatPrice(service.price, service.currency)}</p>
                <Link href={`/services/${service.id}`} className="inlineLink">
                  View details
                </Link>
              </article>
            ))
          ) : (
            <article className="card">
              <h3>No services found</h3>
              <p>Try broadening the query or changing the fulfillment filter.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}

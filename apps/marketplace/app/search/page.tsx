import { SocialServiceCard } from "../../components/social-service-card";
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
    <main className="page page--social">
      <section className="panel panel--social panel--explore">
        <div className="exploreTop">
          <p className="eyebrow eyebrow--social">Explore</p>
          <h1 className="exploreTitle">What do you want to do tonight?</h1>
          <p className="exploreLead">
            Search what creators are putting out—video hangs, custom requests, calls, IRL—then tap in.
          </p>
        </div>
        <form className="exploreSearch" action="/search">
          <input
            className="input input--search"
            type="search"
            name="q"
            placeholder="Search vibes, skills, or titles…"
            defaultValue={params.q ?? ""}
            autoComplete="off"
          />
          <div className="exploreSearchRow">
            <select
              className="input input--select"
              name="fulfillment"
              defaultValue={params.fulfillment ?? ""}
            >
              <option value="">Any format</option>
              <option value="video">Video</option>
              <option value="audio_call">Call</option>
              <option value="chat">Chat</option>
              <option value="custom_request">Custom</option>
              <option value="in_person">In person</option>
            </select>
            <button className="button button--round" type="submit">
              Search
            </button>
          </div>
        </form>
        <div className="visualGrid">
          {services.length > 0 ? (
            services.map((service) => (
              <SocialServiceCard key={service.id} service={service} formatPrice={formatPrice} />
            ))
          ) : (
            <article className="emptyStateCard">
              <h3>Nothing hit that filter</h3>
              <p>Loosen the search or try another format—new stuff drops all the time.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}

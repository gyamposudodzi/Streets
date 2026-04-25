import Link from "next/link";
import { notFound } from "next/navigation";

import { SocialAvatar } from "../../../components/social-avatar";
import { getCreator, getService, listServiceSlots } from "@streets/api-client";
import { gradientForId } from "../../../lib/social-visual";

type ServiceDetailPageProps = {
  params: Promise<{ serviceId: string }>;
};

function formatPrice(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export default async function ServiceDetailPage({ params }: ServiceDetailPageProps) {
  const { serviceId } = await params;
  const service = await getService(serviceId).catch(() => null);

  if (!service) {
    notFound();
  }

  const [slots, host] = await Promise.all([
    listServiceSlots(serviceId).catch(() => []),
    getCreator(service.creator_id).catch(() => null)
  ]);

  const cover = gradientForId(service.id);

  return (
    <main className="page page--social">
      <section className="serviceCover" style={{ background: cover }}>
        <div className="serviceCoverInner">
          <p className="serviceCoverType">{service.fulfillment_type.replaceAll("_", " ")}</p>
          <h1 className="serviceCoverTitle">{service.title}</h1>
          <p className="serviceCoverPrice">{formatPrice(service.price, service.currency)}</p>
        </div>
      </section>

      {host ? (
        <section className="hostBar">
          <SocialAvatar id={host.user_id} name={host.display_name} size="lg" />
          <div className="hostBarText">
            <p className="hostBarLabel">Hosted by</p>
            <p className="hostBarName">{host.display_name}</p>
            <p className="hostBarMeta">
              {host.service_region} · ★ {host.average_rating.toFixed(1)}
            </p>
          </div>
          <Link href={`/search?creator=${host.user_id}`} className="hostBarFollow">
            More from them
          </Link>
        </section>
      ) : null}

      <section className="panel panel--social">
        <h2 className="serviceAboutTitle">About this</h2>
        <p className="serviceAboutBody">{service.description}</p>
        <div className="serviceFacts">
          <span>{service.category}</span>
          <span>·</span>
          <span>{service.duration_minutes} min</span>
        </div>
      </section>

      <section className="panel panel--social">
        <div className="panelHeader">
          <div>
            <p className="eyebrow eyebrow--social">Time</p>
            <h2>Pick a slot or just go for it</h2>
          </div>
          <Link href={`/bookings/new?service=${service.id}`} className="buttonLink button--round">
            Book
          </Link>
        </div>
        <div className="slotGrid">
          {slots.length > 0 ? (
            slots.map((slot) => (
              <article key={slot.id} className="slotCard">
                <p className="slotCardTime">{formatDate(slot.starts_at)}</p>
                <p className="slotCardEnd">→ {formatDate(slot.ends_at)}</p>
                <p className="slotCardState">{slot.is_reserved ? "Taken" : "Open"}</p>
                {!slot.is_reserved ? (
                  <Link
                    href={`/bookings/new?service=${service.id}&slot=${slot.id}`}
                    className="inlineLink"
                  >
                    Lock this time
                  </Link>
                ) : null}
              </article>
            ))
          ) : (
            <article className="emptyStateCard">
              <h3>No calendar blocks</h3>
              <p>
                You can still book—some creators run flexible timing. Hit “Book” and work it out in
                chat.
              </p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}

import Link from "next/link";

import { SocialAvatar } from "../components/social-avatar";
import { SocialCreatorStory } from "../components/social-creator-story";
import { SocialServiceCard } from "../components/social-service-card";
import { listCreators, listServices } from "@streets/api-client";

async function getMarketplaceData() {
  try {
    const [creators, services] = await Promise.all([listCreators(), listServices()]);
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
    <main className="page page--social">
      <section className="socialHero">
        <p className="socialHeroKicker">Your feed starts here</p>
        <h1>Meet people. See what they offer. Book in a tap.</h1>
        <p className="socialHeroSub">
          Scroll creators like stories, then dive into what they’re selling—calls, video, chat,
          in-person hangouts, custom requests. It’s a social layer on top of real bookings.
        </p>
        <div className="socialHeroChips">
          <span className="socialChip">For you</span>
          <span className="socialChip socialChip--mute">·</span>
          <span className="socialChip">{creators.length} people</span>
          <span className="socialChip socialChip--mute">·</span>
          <span className="socialChip accent">{services.length} drops live</span>
        </div>
        {isFallback ? (
          <p className="socialHeroNote">
            Flip the API on to load real faces and listings—this UI is ready to party.
          </p>
        ) : null}
      </section>

      {creators.length > 0 ? (
        <section className="storyRailWrap">
          <div className="storyRailHeader">
            <h2 className="storyRailTitle">People on Streets</h2>
            <Link className="storyRailLink" href="/search">
              See all
            </Link>
          </div>
          <div className="storyStrip" role="list">
            {creators.map((c) => (
              <div key={c.user_id} role="listitem">
                <SocialCreatorStory creator={c} />
              </div>
            ))}
          </div>
        </section>
      ) : null}

      <section className="panel panel--social">
        <div className="panelHeader">
          <div>
            <p className="eyebrow eyebrow--social">Creators you can book</p>
            <h2>Profiles worth a follow</h2>
          </div>
        </div>
        <div className="grid grid--people">
          {creators.length > 0 ? (
            creators.map((creator) => (
              <Link
                key={creator.user_id}
                href={`/search?creator=${creator.user_id}`}
                className="personCard"
              >
                <div className="personCardAvatarWrap">
                  <SocialAvatar id={creator.user_id} name={creator.display_name} size="lg" />
                </div>
                <div>
                  <h3 className="personCardName">{creator.display_name}</h3>
                  <p className="personCardMeta">
                    {creator.service_region} · {creator.country}
                  </p>
                  <p className="personCardRating">★ {creator.average_rating.toFixed(1)}</p>
                </div>
              </Link>
            ))
          ) : (
            <article className="card">
              <h3>Nobody here yet</h3>
              <p>Start the app backend and you’ll see real profiles roll in.</p>
            </article>
          )}
        </div>
      </section>

      <section className="panel panel--social">
        <div className="panelHeader">
          <div>
            <p className="eyebrow eyebrow--social">Explore</p>
            <h2>What’s on the feed</h2>
          </div>
          <Link href="/search" className="textLinkPill">
            Open explore →
          </Link>
        </div>
        <div className="visualGrid">
          {services.length > 0 ? (
            services.map((service) => (
              <SocialServiceCard key={service.id} service={service} formatPrice={formatPrice} />
            ))
          ) : (
            <article className="card">
              <h3>Nothing in the stream</h3>
              <p>Connect the API and listings will show up as visual cards.</p>
            </article>
          )}
        </div>
      </section>
    </main>
  );
}

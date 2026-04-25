import Link from "next/link";

import type { Service } from "@streets/types";

import { gradientForId, shortBlurbs } from "../lib/social-visual";

type SocialServiceCardProps = {
  service: Service;
  formatPrice: (cents: number, currency: string) => string;
};

export function SocialServiceCard({ service, formatPrice }: SocialServiceCardProps) {
  const cover = gradientForId(service.id);

  return (
    <article className="visualServiceCard">
      <Link href={`/services/${service.id}`} className="visualServiceCardLink">
        <div className="visualServiceCardMedia" style={{ background: cover }}>
          <span className="visualServiceCardPrice">
            {formatPrice(service.price, service.currency)}
          </span>
          <span className="visualServiceCardType">
            {service.fulfillment_type.replaceAll("_", " ")}
          </span>
        </div>
        <div className="visualServiceCardBody">
          <h3 className="visualServiceCardTitle">{service.title}</h3>
          <p className="visualServiceCardBlurb">{shortBlurbs(service.description, 90)}</p>
          <div className="visualServiceCardMeta">
            <span>{service.category}</span>
            <span>·</span>
            <span>{service.duration_minutes} min</span>
          </div>
        </div>
      </Link>
    </article>
  );
}

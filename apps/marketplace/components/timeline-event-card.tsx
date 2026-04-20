import type { BookingEvent } from "@streets/types";

type TimelineEventCardProps = {
  event: BookingEvent;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(new Date(value));
}

export function TimelineEventCard({ event }: TimelineEventCardProps) {
  return (
    <article className="timelineEvent">
      <span className="timelineDot" />
      <div>
        <h3>{event.event_type.replaceAll(".", " ")}</h3>
        <p>{event.detail}</p>
        <p className="note">{formatDate(event.created_at)}</p>
      </div>
    </article>
  );
}

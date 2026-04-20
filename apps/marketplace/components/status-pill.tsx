import type { BookingStatus } from "@streets/types";

import { bookingStatusTone, formatBookingStatus } from "./booking-status";

type StatusPillProps = {
  status: BookingStatus | string;
};

export function StatusPill({ status }: StatusPillProps) {
  return (
    <span className={`statusPill ${bookingStatusTone(status)}Pill`}>
      {formatBookingStatus(status)}
    </span>
  );
}

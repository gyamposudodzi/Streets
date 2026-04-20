import type { BookingStatus } from "@streets/types";

type WorkflowStepperProps = {
  status: BookingStatus | string;
};

function isActive(status: string, matches: string[]) {
  return matches.includes(status) ? "flowStep activeStep" : "flowStep";
}

export function WorkflowStepper({ status }: WorkflowStepperProps) {
  return (
    <div className="flowSteps">
      <article className={isActive(status, ["pending_payment"])}>
        <strong>1. Buyer pays</strong>
        <span>Upfront payment creates held funds.</span>
      </article>
      <article className={isActive(status, ["paid_pending_acceptance", "declined"])}>
        <strong>2. Creator decides</strong>
        <span>Creator accepts or declines the booking.</span>
      </article>
      <article className={isActive(status, ["accepted", "in_progress", "awaiting_release"])}>
        <strong>3. Service happens</strong>
        <span>Accepted bookings move through delivery.</span>
      </article>
      <article className={isActive(status, ["delivered", "released", "refunded", "disputed"])}>
        <strong>4. Release or refund</strong>
        <span>Admin handles held-funds decisions.</span>
      </article>
    </div>
  );
}

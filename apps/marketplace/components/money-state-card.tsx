import type { BookingPaymentState } from "@streets/types";

type MoneyStateCardProps = {
  paymentState: BookingPaymentState | null;
};

function formatMoney(cents: number, currency: string) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency
  }).format(cents / 100);
}

export function MoneyStateCard({ paymentState }: MoneyStateCardProps) {
  const payment = paymentState?.payments[0];
  const held = paymentState?.held_funds[0];

  return (
    <article className="moneyCard">
      <p className="eyebrow">Money state</p>
      <h3>{payment ? formatMoney(payment.gross_amount, payment.currency) : "No payment yet"}</h3>
      <p>
        {held
          ? `Creator amount is ${held.status}: ${formatMoney(held.amount, held.currency)}`
          : "Buyer payment has not created held funds yet."}
      </p>
      {payment ? (
        <div className="moneySplit">
          <span>Platform fee: {formatMoney(payment.platform_fee, payment.currency)}</span>
          <span>Creator amount: {formatMoney(payment.creator_amount, payment.currency)}</span>
        </div>
      ) : null}
    </article>
  );
}

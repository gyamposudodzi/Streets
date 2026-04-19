from dataclasses import dataclass
import json
from typing import Protocol
from uuid import uuid4

from app.domain.enums import PaymentWebhookEventStatus
from app.models.entities import Payment, PaymentWebhookEvent, utc_now


@dataclass(frozen=True)
class PaymentIntentResult:
    provider_payment_id: str
    checkout_reference: str
    message: str


@dataclass(frozen=True)
class ParsedWebhookEvent:
    provider_event_id: str
    event_type: str
    payment_id: str | None
    payload: str


class PaymentProvider(Protocol):
    name: str

    def create_payment_intent(self, payment: Payment) -> PaymentIntentResult:
        ...

    def verify_webhook(self, payload: str, signature: str | None) -> bool:
        ...

    def parse_webhook_event(self, payload: str) -> ParsedWebhookEvent:
        ...

    def refund_payment(self, payment: Payment) -> str:
        ...

    def build_success_event(self, payment: Payment) -> PaymentWebhookEvent:
        ...


class SimulatedPaymentProvider:
    name = "simulated"

    def create_payment_intent(self, payment: Payment) -> PaymentIntentResult:
        provider_payment_id = f"sim_{uuid4().hex}"
        return PaymentIntentResult(
            provider_payment_id=provider_payment_id,
            checkout_reference=provider_payment_id,
            message="Simulated payment intent created. Use simulate-success in development.",
        )

    def verify_webhook(self, payload: str, signature: str | None) -> bool:
        return True

    def parse_webhook_event(self, payload: str) -> ParsedWebhookEvent:
        data = json.loads(payload)
        return ParsedWebhookEvent(
            provider_event_id=data["provider_event_id"],
            event_type=data["event_type"],
            payment_id=data.get("payment_id"),
            payload=payload,
        )

    def refund_payment(self, payment: Payment) -> str:
        return f"sim_refund_{payment.id}"

    def build_success_event(self, payment: Payment) -> PaymentWebhookEvent:
        provider_event_id = f"sim_evt_{uuid4().hex}"
        payload = json.dumps(
            {
                "provider_event_id": provider_event_id,
                "event_type": "payment.succeeded",
                "payment_id": payment.id,
                "provider_payment_id": payment.provider_payment_id,
            }
        )
        return PaymentWebhookEvent(
            provider=self.name,
            provider_event_id=provider_event_id,
            event_type="payment.succeeded",
            payment_id=payment.id,
            payload=payload,
            status=PaymentWebhookEventStatus.RECEIVED,
            created_at=utc_now(),
        )


def get_payment_provider(provider: str) -> PaymentProvider:
    if provider == "simulated":
        return SimulatedPaymentProvider()
    raise ValueError(f"Unsupported payment provider: {provider}")

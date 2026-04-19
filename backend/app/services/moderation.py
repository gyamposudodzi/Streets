from dataclasses import dataclass

from app.models.entities import ModerationRule, Service
from app.repositories.sqlite import repository


@dataclass(frozen=True)
class ServiceComplianceResult:
    score: int
    notes: str | None
    should_hold: bool


def scan_service_listing(service: Service) -> ServiceComplianceResult:
    text = " ".join(
        [
            service.title,
            service.description,
            service.category,
            service.fulfillment_type,
        ]
    ).lower()
    matched: list[str] = []
    should_hold = False

    for rule in repository.list_moderation_rules(active_only=True):
        if rule.pattern.lower() not in text:
            continue
        matched.append(f"{rule.label}: {rule.pattern}")
        if rule.action == "hold":
            should_hold = True

    return ServiceComplianceResult(
        score=len(matched),
        notes="; ".join(matched) if matched else None,
        should_hold=should_hold,
    )


def create_moderation_rule(rule: ModerationRule) -> ModerationRule:
    return repository.create_moderation_rule(rule)

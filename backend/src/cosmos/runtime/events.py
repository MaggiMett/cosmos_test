from __future__ import annotations

from collections.abc import Callable, Mapping
from dataclasses import dataclass
from datetime import UTC, datetime
from types import MappingProxyType
from uuid import uuid4

from cosmos.domain.objects import JSONValue
from cosmos.runtime.context import ContextSnapshot

EventHandler = Callable[["RuntimeEvent"], None]


@dataclass(frozen=True, slots=True)
class RuntimeEvent:
    event_id: str
    event_type: str
    timestamp: datetime
    context: ContextSnapshot
    origin_service: str
    affected_object_ids: tuple[str, ...]
    metadata: Mapping[str, JSONValue]

    @classmethod
    def create(
        cls,
        event_type: str,
        *,
        context: ContextSnapshot,
        origin_service: str,
        affected_object_ids: tuple[str, ...] = (),
        metadata: Mapping[str, JSONValue] | None = None,
    ) -> RuntimeEvent:
        return cls(
            event_id=str(uuid4()),
            event_type=event_type,
            timestamp=datetime.now(UTC),
            context=context,
            origin_service=origin_service,
            affected_object_ids=affected_object_ids,
            metadata=MappingProxyType(dict(metadata or {})),
        )


@dataclass(frozen=True, slots=True)
class DeliveryFailure:
    subscription_id: str
    error: Exception


@dataclass(frozen=True, slots=True)
class DeliveryReport:
    delivered: int
    failures: tuple[DeliveryFailure, ...]


class EventDispatcher:
    """In-process foundation dispatcher with ordered, failure-isolated delivery."""

    def __init__(self) -> None:
        self._subscriptions: dict[str, tuple[frozenset[str], EventHandler]] = {}

    def subscribe(self, subscription_id: str, event_types: frozenset[str], handler: EventHandler) -> None:
        if subscription_id in self._subscriptions:
            raise ValueError(f"Subscription already exists: {subscription_id}")
        self._subscriptions[subscription_id] = (event_types, handler)

    def unsubscribe(self, subscription_id: str) -> None:
        self._subscriptions.pop(subscription_id, None)

    def publish(self, event: RuntimeEvent) -> DeliveryReport:
        delivered = 0
        failures: list[DeliveryFailure] = []

        for subscription_id, (event_types, handler) in tuple(self._subscriptions.items()):
            if event_types and event.event_type not in event_types:
                continue
            try:
                handler(event)
                delivered += 1
            except Exception as error:  # subscribers are isolation boundaries
                failures.append(DeliveryFailure(subscription_id, error))

        return DeliveryReport(delivered=delivered, failures=tuple(failures))

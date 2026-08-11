from __future__ import annotations

from dataclasses import dataclass
from typing import Protocol

from cosmos.runtime.context import RuntimeContext


@dataclass(frozen=True, slots=True)
class PermissionRequest:
    requesting_component_id: str
    permission: str
    context: RuntimeContext


@dataclass(frozen=True, slots=True)
class PermissionDecision:
    allowed: bool
    reason: str


class PermissionPolicy(Protocol):
    """Shared policy evaluated authoritatively by the receiving Runtime Service."""

    def evaluate(self, request: PermissionRequest) -> PermissionDecision: ...


class DenyByDefaultPolicy:
    """Safe bootstrap policy until durable grants have a Runtime Service owner."""

    def evaluate(self, request: PermissionRequest) -> PermissionDecision:
        return PermissionDecision(
            allowed=False,
            reason=(f"{request.requesting_component_id} has no explicit grant for {request.permission}."),
        )

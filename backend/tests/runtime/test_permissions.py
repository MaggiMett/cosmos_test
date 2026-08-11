from cosmos.runtime import DenyByDefaultPolicy, PermissionRequest, RuntimeContext


def test_bootstrap_permission_policy_never_assumes_trust() -> None:
    decision = DenyByDefaultPolicy().evaluate(
        PermissionRequest(
            requesting_component_id="community.user-tool.example",
            permission="objects.create",
            context=RuntimeContext(),
        )
    )

    assert decision.allowed is False
    assert "no explicit grant" in decision.reason

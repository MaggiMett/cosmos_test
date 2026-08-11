from cosmos.runtime import ContextSnapshot, EventDispatcher, RuntimeContext, RuntimeEvent


def test_dispatcher_isolates_subscriber_failures() -> None:
    dispatcher = EventDispatcher()
    received: list[str] = []

    def fail(_: RuntimeEvent) -> None:
        raise RuntimeError("subscriber failed")

    dispatcher.subscribe("failing", frozenset({"ObjectCreated"}), fail)
    dispatcher.subscribe(
        "working", frozenset({"ObjectCreated"}), lambda event: received.append(event.event_id)
    )
    event = RuntimeEvent.create(
        "ObjectCreated",
        context=ContextSnapshot.capture(RuntimeContext(), "user"),
        origin_service="object-service",
    )

    report = dispatcher.publish(event)

    assert received == [event.event_id]
    assert report.delivered == 1
    assert report.failures[0].subscription_id == "failing"

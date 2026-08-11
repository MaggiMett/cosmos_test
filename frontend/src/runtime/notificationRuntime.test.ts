import { afterEach, describe, expect, it, vi } from "vitest";

import { CosmosApiClient } from "./apiClient";
import { BaseRuntime } from "./baseRuntime";
import { CosmosMapRuntime } from "./cosmosMapRuntime";
import { NotificationRuntime, type CosmosNotification } from "./notificationRuntime";

const notification: CosmosNotification = {
  objectId: "notification.one",
  displayName: "Project updated",
  description: "The Project changed.",
  systemTags: ["Notification"],
  userTags: [],
  category: "Projects",
  message: "The Project changed.",
  sourceObjectId: "project.one",
  destinationObjectId: "project.one",
  read: false,
  createdAt: "2026-07-18T10:00:00+00:00",
  primaryProjectId: "project.one",
};

describe("NotificationRuntime", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("loads Companion-owned Notifications and marks entries read", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce(
        new Response(JSON.stringify([notification]), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      )
      .mockResolvedValueOnce(
        new Response(JSON.stringify({ ...notification, read: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        }),
      );
    vi.stubGlobal("fetch", fetchMock);
    const api = new CosmosApiClient("http://cosmos.test");
    const runtime = new NotificationRuntime(api, new CosmosMapRuntime(api), new BaseRuntime(api));

    await runtime.load();
    await runtime.markRead(notification.objectId);

    expect(runtime.state.values[0]?.read).toBe(true);
    expect(fetchMock.mock.calls.map(([url]) => url)).toEqual([
      "http://cosmos.test/notifications",
      "http://cosmos.test/notifications/notification.one",
    ]);
  });
});

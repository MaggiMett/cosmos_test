import { describe, expect, it } from "vitest";

import { TransitionRuntime } from "./transitionRuntime";

describe("TransitionRuntime", () => {
  it("serializes transitions and continues after a failed transition", async () => {
    const runtime = new TransitionRuntime();
    const order: string[] = [];

    const first = runtime.enqueue({
      kind: "theme",
      targetId: "theme-a",
      run: async () => {
        order.push("first:start");
        await Promise.resolve();
        order.push("first:end");
      },
    });
    const failed = runtime.enqueue({
      kind: "window",
      targetId: "window-a",
      run: () => {
        order.push("failed");
        throw new Error("transition failed");
      },
    });
    const last = runtime.enqueue({
      kind: "navigation",
      targetId: "cosmos",
      run: () => order.push("last"),
    });

    await first;
    await expect(failed).rejects.toThrow("transition failed");
    await last;
    await runtime.settled();

    expect(order).toEqual(["first:start", "first:end", "failed", "last"]);
    expect(runtime.active).toBeNull();
  });
});

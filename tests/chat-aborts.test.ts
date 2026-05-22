import { describe, expect, it, vi } from "vitest";
import { ChatAbortRegistry } from "../src/main/chat-aborts";

describe("ChatAbortRegistry", () => {
  it("isolates active chats by profile and session", () => {
    const registry = new ChatAbortRegistry();
    const defaultAbort = vi.fn();
    const researchAbort = vi.fn();

    registry.replace(undefined, "session-1", defaultAbort);
    registry.replace("research", "session-1", researchAbort);

    expect(registry.abort(undefined, "session-1")).toBe(true);
    expect(defaultAbort).toHaveBeenCalledTimes(1);
    expect(researchAbort).not.toHaveBeenCalled();
    expect(registry.size()).toBe(1);
  });

  it("replaces only the matching chat key", () => {
    const registry = new ChatAbortRegistry();
    const first = vi.fn();
    const second = vi.fn();
    const otherProfile = vi.fn();

    registry.replace("default", "session-1", first);
    registry.replace("other", "session-1", otherProfile);
    registry.replace("default", "session-1", second);

    expect(first).toHaveBeenCalledTimes(1);
    expect(otherProfile).not.toHaveBeenCalled();

    registry.abort("default", "session-1");
    expect(second).toHaveBeenCalledTimes(1);
    expect(otherProfile).not.toHaveBeenCalled();
  });
});

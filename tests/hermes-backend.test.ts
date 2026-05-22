import { describe, expect, it, vi } from "vitest";

const { modeRef, remoteUrlRef, sshUrlRef } = vi.hoisted(() => ({
  modeRef: { mode: "local" as "local" | "remote" | "ssh" },
  remoteUrlRef: { url: "" },
  sshUrlRef: { url: "http://127.0.0.1:18642/v1" },
}));

vi.mock("../src/main/config", () => ({
  getConnectionConfig: () => ({
    mode: modeRef.mode,
    remoteUrl: remoteUrlRef.url,
    apiKey: "",
    ssh: {
      host: "",
      port: 22,
      username: "",
      keyPath: "",
      remotePort: 8642,
      localPort: 18642,
    },
  }),
}));

vi.mock("../src/main/ssh-tunnel", () => ({
  getSshTunnelUrl: () => sshUrlRef.url,
}));

import {
  backendContextKey,
  getHermesBackendContext,
  normaliseRemoteUrl,
} from "../src/main/hermes-backend";

describe("hermes backend context", () => {
  it("normalises user-entered /v1 URLs once at the backend boundary", () => {
    expect(normaliseRemoteUrl(" http://host:8642/v1/ ")).toBe(
      "http://host:8642",
    );
  });

  it("describes local, remote, and ssh backends with stable cache keys", () => {
    modeRef.mode = "local";
    expect(getHermesBackendContext("default")).toMatchObject({
      mode: "local",
      apiBaseUrl: "http://127.0.0.1:8642",
      remoteOnly: false,
    });
    expect(backendContextKey("default")).toBe(
      "local:default:http://127.0.0.1:8642",
    );

    modeRef.mode = "remote";
    remoteUrlRef.url = "https://api.example.com/v1";
    expect(getHermesBackendContext("research")).toMatchObject({
      mode: "remote",
      profile: "research",
      apiBaseUrl: "https://api.example.com",
      remoteOnly: true,
    });

    modeRef.mode = "ssh";
    expect(getHermesBackendContext("research")).toMatchObject({
      mode: "ssh",
      apiBaseUrl: "http://127.0.0.1:18642",
      remoteOnly: false,
    });
  });
});

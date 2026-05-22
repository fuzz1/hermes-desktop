import { getConnectionConfig } from "./config";
import { getSshTunnelUrl } from "./ssh-tunnel";

const LOCAL_API_URL = "http://127.0.0.1:8642";

export type HermesBackendMode = "local" | "remote" | "ssh";

export interface HermesBackendContext {
  mode: HermesBackendMode;
  profile: string;
  apiBaseUrl: string;
  remoteOnly: boolean;
}

export function normaliseRemoteUrl(raw: string): string {
  let url = (raw || "").trim();
  url = url.replace(/\/+$/, "");
  url = url.replace(/\/v1$/i, "");
  return url;
}

export function getHermesBackendContext(profile?: string): HermesBackendContext {
  const conn = getConnectionConfig();
  const profileKey = profile || "default";

  if (conn.mode === "ssh") {
    const sshUrl = getSshTunnelUrl();
    if (!sshUrl) throw new Error("SSH tunnel is not active");
    return {
      mode: "ssh",
      profile: profileKey,
      apiBaseUrl: normaliseRemoteUrl(sshUrl),
      remoteOnly: false,
    };
  }

  if (conn.mode === "remote" && conn.remoteUrl) {
    return {
      mode: "remote",
      profile: profileKey,
      apiBaseUrl: normaliseRemoteUrl(conn.remoteUrl),
      remoteOnly: true,
    };
  }

  return {
    mode: "local",
    profile: profileKey,
    apiBaseUrl: LOCAL_API_URL,
    remoteOnly: false,
  };
}

export function backendContextKey(profile?: string): string {
  const context = getHermesBackendContext(profile);
  return `${context.mode}:${context.profile}:${context.apiBaseUrl}`;
}

export function isRemoteBackend(profile?: string): boolean {
  return getHermesBackendContext(profile).mode !== "local";
}

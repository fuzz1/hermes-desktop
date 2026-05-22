export function deriveApiKeyEnvFromBaseUrl(baseUrl: string): string | null {
  const hostname = extractHostname(baseUrl);
  if (!hostname) return null;
  if (hostname === "localhost" || hostname.includes(":")) return null;

  const labels = hostname.split(".").filter(Boolean);
  if (labels.length === 0 || /^\d/.test(labels[labels.length - 1])) {
    return null;
  }
  while (labels.length > 0 && (labels[0] === "api" || labels[0] === "www")) {
    labels.shift();
  }
  if (labels.length < 2) return null;

  const vendor = labels[labels.length - 2]
    .replace(/[^a-z0-9]/gi, "_")
    .toUpperCase();
  if (!/^[A-Z]/.test(vendor)) return null;
  if (vendor === "OPENAI" || vendor === "OPENROUTER" || vendor === "OLLAMA") {
    return null;
  }
  return `${vendor}_API_KEY`;
}

function extractHostname(rawUrl: string): string {
  const trimmed = rawUrl.trim();
  if (!trimmed) return "";
  try {
    return new URL(trimmed).hostname.toLowerCase();
  } catch {
    try {
      return new URL(`http://${trimmed}`).hostname.toLowerCase();
    } catch {
      return "";
    }
  }
}

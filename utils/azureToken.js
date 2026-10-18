// Shared Azure Speech token cache (used by both the reading game and the
// free-speaking exercise so they don't fetch separate tokens).

const TOKEN_TTL_MS = 9 * 60 * 1000; // Azure tokens live 10 min; refresh a bit early
let cache = null; // { token, region, expiresAt }

// minRemainingMs: how long the cached token must still be usable. Long
// recordings (the speaking exercise) ask for more headroom.
export async function getAzureToken({ minRemainingMs = 30 * 1000 } = {}) {
  if (cache && cache.expiresAt - Date.now() > minRemainingMs) return cache;

  const res = await fetch("/api/speech-token", { cache: "no-store" });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || !data.token) {
    const err = new Error(data.code || "TOKEN_FAILED");
    err.kind = "service";
    throw err;
  }
  cache = {
    token: data.token,
    region: data.region,
    expiresAt: Date.now() + TOKEN_TTL_MS,
  };
  return cache;
}

export function invalidateAzureToken() {
  cache = null;
}

// "mic"     -> permission denied / no microphone
// "service" -> token, auth, quota, network problems
export function classifyAzureError(message) {
  const msg = String(message || "");
  if (/permission|denied|notallowed|notfound|microphone|getusermedia/i.test(msg)) return "mic";
  return "service";
}

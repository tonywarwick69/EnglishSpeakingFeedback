import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Issues a short-lived (10 min) Azure Speech authorization token so the browser
// SDK can talk to Azure without ever seeing AZURE_SPEECH_KEY.
//
// Abuse protection (best-effort — see note below):
//   1. Only same-origin browser requests are accepted (Sec-Fetch-Site header).
//   2. Per-IP limit:  MAX_PER_IP  tokens per WINDOW_MS.
//   3. Global limit:  MAX_GLOBAL  tokens per WINDOW_MS (protects the free quota).
//
// NOTE: counters live in memory, so on Vercel each warm serverless instance keeps
// its own counts. That's enough to stop casual abuse, but it is not a hard cap.
// For a strict limit use a shared store (e.g. Upstash Redis / Vercel KV) and
// also set an Azure budget alert.
// ---------------------------------------------------------------------------

const WINDOW_MS = 10 * 60 * 1000; // 10 minutes
const MAX_PER_IP = 20; // a normal session needs 1-2 tokens (client caches ~9 min)
const MAX_GLOBAL = 400;

const hits = new Map(); // ip -> number[] (timestamps)
let globalHits = [];

function prune(list, now) {
  while (list.length && now - list[0] > WINDOW_MS) list.shift();
  return list;
}

function checkRateLimit(ip) {
  const now = Date.now();

  globalHits = prune(globalHits, now);
  const mine = prune(hits.get(ip) || [], now);

  if (globalHits.length >= MAX_GLOBAL || mine.length >= MAX_PER_IP) {
    const oldest = (mine.length >= MAX_PER_IP ? mine : globalHits)[0] ?? now;
    return { ok: false, retryAfter: Math.max(1, Math.ceil((oldest + WINDOW_MS - now) / 1000)) };
  }

  mine.push(now);
  globalHits.push(now);
  hits.set(ip, mine);

  // Keep the map from growing forever
  if (hits.size > 5000) {
    for (const [key, list] of hits) {
      if (!prune(list, now).length) hits.delete(key);
    }
  }
  return { ok: true };
}

function clientIp(request) {
  const fwd = request.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0].trim();
  return request.headers.get("x-real-ip") || "unknown";
}

function json(body, status = 200, extraHeaders = {}) {
  return NextResponse.json(body, {
    status,
    headers: { "Cache-Control": "no-store", ...extraHeaders },
  });
}

export async function GET(request) {
  const key = process.env.AZURE_SPEECH_KEY;
  const region = process.env.AZURE_SPEECH_REGION;

  if (!key || !region) {
    console.error("[speech-token] AZURE_SPEECH_KEY / AZURE_SPEECH_REGION not set");
    return json({ ok: false, code: "NOT_CONFIGURED" }, 500);
  }

  // Browsers always send Sec-Fetch-Site. Reject cross-site / direct navigation.
  // (Non-browser clients omit it and are still covered by the rate limit.)
  const site = request.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") {
    return json({ ok: false, code: "FORBIDDEN" }, 403);
  }

  const limit = checkRateLimit(clientIp(request));
  if (!limit.ok) {
    return json({ ok: false, code: "RATE_LIMITED" }, 429, {
      "Retry-After": String(limit.retryAfter),
    });
  }

  try {
    const res = await fetch(
      `https://${region}.api.cognitive.microsoft.com/sts/v1.0/issueToken`,
      {
        method: "POST",
        headers: {
          "Ocp-Apim-Subscription-Key": key,
          "Content-Length": "0",
        },
        cache: "no-store",
      }
    );

    if (!res.ok) {
      console.error("[speech-token] Azure responded", res.status, await res.text().catch(() => ""));
      return json({ ok: false, code: "AZURE_REJECTED", status: res.status }, 502);
    }

    const token = await res.text();
    return json({ ok: true, token, region, expiresInSeconds: 540 });
  } catch (err) {
    console.error("[speech-token]", err);
    return json({ ok: false, code: "TOKEN_FETCH_FAILED" }, 502);
  }
}

/**
 * The single place where this feature touches the network.
 *
 * Everything goes through `request()`, which adds realistic browser headers,
 * a hard timeout, bounded retries and an optional scraping proxy. Nothing in
 * here throws for an HTTP error — callers get a result object and decide.
 */

import { FETCH_PROXY_TEMPLATE, POLICY } from "./config";

const USER_AGENTS = [
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:133.0) Gecko/20100101 Firefox/133.0",
];

function userAgent(attempt = 0) {
  return USER_AGENTS[attempt % USER_AGENTS.length];
}

function browserHeaders(url, attempt) {
  let origin = "https://www.google.de/";
  try {
    origin = new URL(url).origin + "/";
  } catch {
    /* keep the Google referer */
  }

  return {
    "User-Agent": userAgent(attempt),
    Accept:
      "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
    "Accept-Language": "de-DE,de;q=0.9,en;q=0.5",
    "Cache-Control": "no-cache",
    Pragma: "no-cache",
    "Upgrade-Insecure-Requests": "1",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "same-origin",
    "Sec-Fetch-User": "?1",
    "sec-ch-ua": '"Chromium";v="131", "Not_A Brand";v="24"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"Windows"',
    Referer: origin,
  };
}

function proxied(url) {
  if (!FETCH_PROXY_TEMPLATE) return url;
  if (FETCH_PROXY_TEMPLATE.includes("{url}")) {
    return FETCH_PROXY_TEMPLATE.replace("{url}", encodeURIComponent(url));
  }
  return `${FETCH_PROXY_TEMPLATE}${encodeURIComponent(url)}`;
}

/** First readable words of a response body, tags stripped. */
function textExcerpt(body, length = 300) {
  return String(body)
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, length);
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * @returns {Promise<{ok:boolean,status:number,body:string,url:string,
 *                    durationMs:number,error:string|null,blocked:boolean}>}
 */
export async function request(
  url,
  {
    headers = {},
    method = "GET",
    body = null,
    timeoutMs = POLICY.requestTimeoutMs,
    retries = POLICY.requestRetries,
    useProxy = true,
    useBrowserHeaders = true,
    label = "",
  } = {},
) {
  const startedAt = Date.now();
  let lastError = null;
  let lastStatus = 0;
  let lastBody = "";

  for (let attempt = 0; attempt <= retries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const target = useProxy ? proxied(url) : url;
      const response = await fetch(target, {
        method,
        body,
        redirect: "follow",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          ...(useBrowserHeaders ? browserHeaders(url, attempt) : {}),
          ...headers,
        },
      });

      const text = await response.text();
      lastStatus = response.status;
      lastBody = text;

      if (response.ok) {
        return {
          ok: true,
          status: response.status,
          body: text,
          url: response.url || url,
          durationMs: Date.now() - startedAt,
          error: null,
          blocked: false,
        };
      }

      // 403 is retried once: portals with bot protection hand it out for a
      // single unlucky request, and the next attempt rotates the user agent.
      const retryable =
        response.status === 429 ||
        response.status === 408 ||
        response.status === 403 ||
        response.status >= 500;

      lastError = `HTTP ${response.status}`;

      if (!retryable || attempt === retries) break;

      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter)
        ? Math.min(retryAfter * 1000, 5_000)
        : (response.status === 403 || response.status === 429 ? 1_200 : 400) *
          2 ** attempt;
      await sleep(waitMs);
    } catch (error) {
      lastError =
        error?.name === "AbortError"
          ? `Zeitüberschreitung nach ${Math.round(timeoutMs / 1000)}s`
          : error?.message || String(error);
      if (attempt === retries) break;
      await sleep(300 * 2 ** attempt);
    } finally {
      clearTimeout(timer);
    }
  }

  // 403/429 plus an interstitial body is the signature of bot protection.
  const blocked =
    lastStatus === 403 ||
    lastStatus === 429 ||
    /captcha|are you a human|bot detection|access denied|zugriff verweigert/i.test(
      lastBody.slice(0, 4_000),
    );

  return {
    ok: false,
    status: lastStatus,
    body: lastBody,
    url,
    durationMs: Date.now() - startedAt,
    error: `${label ? `${label}: ` : ""}${lastError || "Anfrage fehlgeschlagen"}`,
    blocked,
    // A short excerpt of whatever came back, for diagnosing a failure that
    // only shows up on the live server.
    bodyExcerpt: lastBody ? textExcerpt(lastBody) : null,
  };
}

/** Convenience wrapper for JSON APIs (no browser headers, no proxy). */
export async function requestJson(url, options = {}) {
  const result = await request(url, {
    useBrowserHeaders: false,
    useProxy: false,
    ...options,
    headers: {
      Accept: "application/json",
      ...(options.headers || {}),
    },
  });

  if (!result.ok) return { ...result, data: null };

  try {
    return { ...result, data: JSON.parse(result.body) };
  } catch {
    return {
      ...result,
      ok: false,
      data: null,
      error: `${options.label || "API"}: ungültiges JSON`,
    };
  }
}

export function isProxyConfigured() {
  return Boolean(FETCH_PROXY_TEMPLATE);
}

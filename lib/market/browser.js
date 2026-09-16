/**
 * Real-browser fetching, used when a portal refuses a plain HTTP request.
 *
 * mobile.de fingerprints more than headers — TLS handshake, HTTP/2 frames and
 * JS execution all feed its bot detection, and no amount of header spoofing on
 * `fetch` gets past that. Playwright drives actual Chromium, so the request is
 * indistinguishable from the dealer opening the ad himself.
 *
 * Playwright is already a dependency of this project and is declared in
 * next.config.js under `serverExternalPackages`, so nothing new is required —
 * except the Chromium binary, which `npx playwright install chromium` fetches.
 *
 * The browser is started once and reused, then closed after a few minutes of
 * inactivity so a dev server does not hold it open forever.
 */

import os from "node:os";
import path from "node:path";

const IDLE_SHUTDOWN_MS = 3 * 60_000;
const USER_AGENT =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36";

let browserPromise = null;
let idleTimer = null;
let unavailableReason = null;
let warmedHosts = new Set();

/**
 * A profile directory that survives restarts. A browser with no cookies, no
 * consent record and no history opening a deep link is exactly what bot
 * detection looks for; one that has been to the site before is not.
 */
function profileDirectory() {
  return path.join(os.tmpdir(), "marktanalyse-chromium-profile");
}

export function isBrowserFallbackEnabled() {
  return process.env.MARKET_BROWSER_FALLBACK !== "0";
}

function scheduleShutdown() {
  clearTimeout(idleTimer);
  idleTimer = setTimeout(async () => {
    const pending = browserPromise;
    browserPromise = null;
    try {
      const browser = await pending;
      await browser?.close();
    } catch {
      /* closing a dead browser is not an error worth reporting */
    }
  }, IDLE_SHUTDOWN_MS);

  // Never hold the process open just for the idle timer.
  idleTimer.unref?.();
}

async function getBrowser() {
  if (unavailableReason) throw new Error(unavailableReason);

  if (!browserPromise) {
    browserPromise = (async () => {
      const { chromium } = await import("playwright");

      // A persistent context is browser and context in one, and keeps the
      // cookie jar on disk so the consent banner is only answered once.
      return chromium.launchPersistentContext(profileDirectory(), {
        headless: true,
        userAgent: USER_AGENT,
        locale: "de-DE",
        timezoneId: "Europe/Berlin",
        viewport: { width: 1440, height: 900 },
        extraHTTPHeaders: { "Accept-Language": "de-DE,de;q=0.9,en;q=0.5" },
        args: [
          // Removes the flag that marks the session as automated.
          "--disable-blink-features=AutomationControlled",
          "--disable-dev-shm-usage",
          "--no-sandbox",
          "--disable-gpu",
        ],
      });
    })().catch((error) => {
      browserPromise = null;
      const message = String(error?.message || error);

      unavailableReason = /Executable doesn't exist|browserType.launch/i.test(message)
        ? "Chromium für Playwright fehlt. Einmalig ausführen: npx playwright install chromium"
        : `Browser konnte nicht gestartet werden: ${message}`;

      throw new Error(unavailableReason);
    });
  }

  return browserPromise;
}

/**
 * Loads a page in real Chromium and returns its rendered HTML.
 *
 * @param {string} url
 * @param {object} [options]
 * @param {number} [options.timeoutMs]
 * @param {string} [options.waitForText]  keep waiting until this appears
 * @returns {Promise<{ok:boolean,html:string|null,status:number,error:string|null,
 *                    durationMs:number,unavailable:boolean}>}
 */
export async function fetchWithBrowser(url, { timeoutMs = 25_000, waitForText = null } = {}) {
  const startedAt = Date.now();

  if (!isBrowserFallbackEnabled()) {
    return {
      ok: false,
      html: null,
      status: 0,
      error: "Browser-Fallback ist deaktiviert (MARKET_BROWSER_FALLBACK=0).",
      durationMs: 0,
      unavailable: true,
    };
  }

  let page = null;

  try {
    // A persistent context is browser and context in one, so pages are opened
    // on it directly and it is never closed between requests.
    const context = await getBrowser();

    await context.addInitScript(() => {
      Object.defineProperty(navigator, "webdriver", { get: () => undefined });
      Object.defineProperty(navigator, "languages", {
        get: () => ["de-DE", "de", "en"],
      });
    });

    page = await context.newPage();

    // Images, fonts and media are most of the load time and none of the value.
    // Scripts and stylesheets stay, because the detection scripts have to be
    // allowed to run and pass.
    await page.route("**/*", (route) => {
      const type = route.request().resourceType();
      if (type === "image" || type === "font" || type === "media") return route.abort();
      return route.continue();
    });

    await warmUp(page, url, timeoutMs);

    const response = await page.goto(url, {
      waitUntil: "domcontentloaded",
      timeout: timeoutMs,
    });

    if (waitForText) {
      await page
        .waitForFunction(
          (needle) => document.body?.innerText?.includes(needle),
          waitForText,
          { timeout: Math.min(8_000, timeoutMs) },
        )
        .catch(() => {
          /* best effort — carry on with whatever loaded */
        });
    } else {
      await page.waitForTimeout(600);
    }

    const html = await page.content();
    const status = response?.status() ?? 0;

    return {
      ok: Boolean(html) && html.length > 2_000 && status < 400,
      html,
      status,
      error:
        status >= 400 ? `Browser erhielt HTTP ${status}` : !html ? "Leere Seite" : null,
      durationMs: Date.now() - startedAt,
      unavailable: false,
    };
  } catch (error) {
    const message = String(error?.message || error);
    return {
      ok: false,
      html: null,
      status: 0,
      error: message,
      durationMs: Date.now() - startedAt,
      unavailable:
        message.includes("playwright install") || message.includes("Cannot find module"),
    };
  } finally {
    await page?.close().catch(() => {});
    scheduleShutdown();
  }
}

/**
 * Visits the portal's front page once per session and answers the consent
 * banner, so the ad is opened by a browser that already has cookies and a
 * referrer — the way a person reaches it. Jumping straight to a deep link with
 * an empty cookie jar is one of the clearest bot signals there is.
 */
async function warmUp(page, url, timeoutMs) {
  let host;
  try {
    host = new URL(url).host;
  } catch {
    return;
  }

  if (warmedHosts.has(host)) return;
  warmedHosts.add(host);

  try {
    await page.goto(`https://${host}/`, {
      waitUntil: "domcontentloaded",
      timeout: Math.min(15_000, timeoutMs),
    });
    await acceptConsent(page);
    await page.waitForTimeout(800 + Math.floor(Math.random() * 700));
  } catch {
    // A failed warm-up is not fatal; the real navigation still gets its try.
  }
}

/** Clicks the German cookie-consent button, wherever it happens to live. */
async function acceptConsent(page) {
  const labels = [
    "Alle akzeptieren",
    "Alles akzeptieren",
    "Akzeptieren und weiter",
    "Einverstanden",
    "Zustimmen",
    "Ich stimme zu",
    "Accept all",
  ];

  // The banner is often inside an iframe, so every frame is checked.
  for (const frame of page.frames()) {
    for (const label of labels) {
      try {
        const button = frame.getByRole("button", { name: label, exact: false });
        if (await button.first().isVisible({ timeout: 700 })) {
          await button.first().click({ timeout: 2_000 });
          await page.waitForTimeout(500);
          return true;
        }
      } catch {
        /* try the next label */
      }
    }
  }

  return false;
}


/** For the diagnostics endpoint. */
export async function browserStatus() {
  if (!isBrowserFallbackEnabled()) {
    return { available: false, reason: "per MARKET_BROWSER_FALLBACK=0 deaktiviert" };
  }
  try {
    await getBrowser();
    return { available: true, reason: null };
  } catch (error) {
    return { available: false, reason: String(error?.message || error) };
  }
}

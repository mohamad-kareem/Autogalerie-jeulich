import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { analyzeListing, AnalysisError } from "@/lib/market/analyze";
import { POLICY } from "@/lib/market/config";
import { browserStatus } from "@/lib/market/browser";
import { loadObservations, recordObservation } from "@/lib/market/history";
import { isProxyConfigured } from "@/lib/market/http";
import {
  diagnose as diagnoseMobile,
  isConfigured as mobileConfigured,
} from "@/lib/market/sources/mobilede";
import {
  mayRedirectToListing,
  validateListingUrl,
} from "@/lib/market/sources/urls";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

/** Hard stop so the request always answers before the platform kills it. */
function withDeadline(promise, ms) {
  let timer;
  const deadline = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new AnalysisError(
            `Die Analyse hat länger als ${Math.round(ms / 1000)} Sekunden gebraucht und wurde abgebrochen.`,
            { status: 504 },
          ),
        ),
      ms,
    );
  });

  return Promise.race([promise, deadline]).finally(() => clearTimeout(timer));
}

/**
 * GET /api/market-analysis?diagnose=1
 * Reports which data sources this deployment can actually reach. Use it once
 * after deploying instead of guessing why a source is missing.
 */
export async function GET(request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) return json({ error: "Nicht autorisiert." }, 401);

  const { searchParams } = new URL(request.url);
  if (searchParams.get("diagnose") !== "1") {
    return json({ error: "Unbekannter Aufruf." }, 400);
  }

  // Pass ?url=<ad link> to test that exact ad end to end.
  const sampleUrl = searchParams.get("url");

  const { SOURCES } = await import("@/lib/market/sources");

  const probeTarget = {
    make: "Volkswagen",
    model: "Golf",
    registrationMonths: 2019 * 12 + 5,
    mileageKm: 90_000,
    powerKw: 110,
    fuel: "PETROL",
    gearbox: "MANUAL",
    listingUrl: null,
  };

  const checks = await Promise.all(
    Object.entries(SOURCES).map(async ([id, source]) => {
      const startedAt = Date.now();
      try {
        const result = await source.searchComparables(probeTarget, { limit: 5 });
        return {
          source: id,
          reachable: Boolean(result.ok),
          listings: result.vehicles?.length || 0,
          blocked: Boolean(result.blocked),
          skipped: Boolean(result.skipped),
          error: result.error || null,
          durationMs: Date.now() - startedAt,
        };
      } catch (error) {
        return {
          source: id,
          reachable: false,
          listings: 0,
          blocked: false,
          skipped: false,
          error: error?.message || String(error),
          durationMs: Date.now() - startedAt,
        };
      }
    }),
  );

  const [mobile, browser] = await Promise.all([
    diagnoseMobile(sampleUrl),
    browserStatus(),
  ]);

  return json({
    checkedAt: new Date().toISOString(),
    environment: {
      mobileDeCredentials: mobileConfigured(),
      openAiKey: Boolean(process.env.OPENAI_API_KEY),
      scrapeProxy: isProxyConfigured(),
      realBrowser: browser,
    },
    mobileDe: mobile,
    sources: checks,
    hint: browser.available
      ? checks.some((check) => check.reachable)
        ? null
        : "Keine Quelle erreichbar – Netzwerk oder Firewall prüfen."
      : `Echter Browser nicht verfügbar (${browser.reason}). Für mobile.de einmalig ausführen: npx playwright install chromium`,
  });
}

/**
 * POST /api/market-analysis
 * body: { url, targetProfit?, negotiatedPrice?, refurbishmentCost?,
 *          pickupPostcode?, skipModel?, pastedText?, manualVehicle? }
 */
export async function POST(request) {
  let session;
  try {
    session = await getServerSession(authOptions);
  } catch (error) {
    console.error("market-analysis: session error", error);
    return json({ error: "Sitzung konnte nicht geprüft werden." }, 500);
  }

  if (!session?.user) return json({ error: "Nicht autorisiert." }, 401);

  let body;
  try {
    body = await request.json();
  } catch {
    return json({ error: "Ungültige Anfrage." }, 400);
  }

  // Only obviously wrong links are refused here. A recognised portal link
  // without a readable ad id (share/short links) is passed through, because
  // the resolver follows its redirects before giving up.
  // Pasted ad text carries everything the analysis needs, so it may come
  // without a link — copying the ad is then the only step for the buyer.
  const hasText =
    typeof body?.pastedText === "string" && body.pastedText.trim().length > 40;
  const validation = validateListingUrl(body?.url);
  if (!validation.ok && !mayRedirectToListing(body?.url) && !hasText) {
    return json({ error: validation.error, code: "INVALID_URL" }, 400);
  }
  const listingUrl = validation.ok
    ? validation.url
    : hasText
      ? null
      : String(body.url).trim();

  const options = {};

  // Target profit the buyer wants left over.
  const profit = Number(body?.targetProfit);
  if (Number.isFinite(profit) && profit >= 0 && profit <= 100_000) {
    options.targetProfit = profit;
  }

  // The price actually on the table after speaking to the seller. When it is
  // there, the whole calculation runs on it instead of the advertised price.
  const negotiated = Number(body?.negotiatedPrice);
  if (Number.isFinite(negotiated) && negotiated > 0 && negotiated <= 1_000_000) {
    options.negotiatedPrice = negotiated;
  }

  // Refurbishment the buyer enters himself; nothing is assumed.
  const refurbishment = Number(body?.refurbishmentCost);
  if (Number.isFinite(refurbishment) && refurbishment >= 0 && refurbishment <= 100_000) {
    options.refurbishmentCost = refurbishment;
  }

  // Postcode for the pickup route, when the ad does not give a location.
  if (typeof body?.pickupPostcode === "string") {
    const code = body.pickupPostcode.trim().slice(0, 40);
    if (code) options.pickupPostcode = code;
  }

  // How the collector travels out, how long he needs, and what the ticket cost.
  if (body?.pickupMode === "TRAIN" || body?.pickupMode === "CAR") {
    options.pickupMode = body.pickupMode;
  }

  const inbound = Number(body?.pickupInboundMinutes);
  if (Number.isFinite(inbound) && inbound > 0 && inbound <= 24 * 60) {
    options.pickupInboundMinutes = inbound;
  }

  const onSite = Number(body?.pickupOnSiteMinutes);
  if (Number.isFinite(onSite) && onSite >= 0 && onSite <= 12 * 60) {
    options.pickupOnSiteMinutes = onSite;
  }

  const ticket = Number(body?.pickupTicketCost);
  if (Number.isFinite(ticket) && ticket >= 0 && ticket <= 2_000) {
    options.pickupTicketCost = ticket;
  }

  const fuel = Number(body?.pickupFuelCost);
  if (Number.isFinite(fuel) && fuel >= 0 && fuel <= 2_000) {
    options.pickupFuelCost = fuel;
  }
  if (body?.skipModel === true) options.skipModel = true;

  // The ad page itself, sent by the buyer's browser through the one-click
  // import button. Capped well above a real ad page (about 0,5–1,5 MB).
  if (typeof body?.pageHtml === "string" && body.pageHtml.length > 500) {
    options.pageHtml = body.pageHtml.slice(0, 4_000_000);
  }

  // Ad text copied from the portal page — the reliable route when a portal
  // refuses server-side reads.
  if (typeof body?.pastedText === "string" && body.pastedText.trim().length > 40) {
    options.pastedText = body.pastedText.slice(0, 60_000);
  }

  // Supplied when the portal blocked the ad and the user typed the figures.
  if (body?.manualVehicle && typeof body.manualVehicle === "object") {
    const manual = body.manualVehicle;
    options.manualVehicle = {
      make: String(manual.make || "").slice(0, 60),
      model: String(manual.model || "").slice(0, 60),
      variant: String(manual.variant || "").slice(0, 120),
      title: String(manual.title || "").slice(0, 200),
      price: Number(manual.price) || null,
      firstRegistration: String(manual.firstRegistration || "").slice(0, 10),
      mileageKm: Number(manual.mileageKm) || null,
      powerPs: Number(manual.powerPs) || null,
      fuel: String(manual.fuel || "UNKNOWN"),
      gearbox: String(manual.gearbox || "UNKNOWN"),
      sellerType: String(manual.sellerType || "UNKNOWN"),
      condition: String(manual.condition || "UNKNOWN"),
      priceType: String(manual.priceType || "UNKNOWN"),
      serviceHistory: String(manual.serviceHistory || "UNKNOWN"),
      tuvUntil: String(manual.tuvUntil || "").slice(0, 10) || null,
    };
  }

  // Earlier sightings of this ad, so the analysis can say whether the price
  // has moved. Never allowed to block or fail the analysis.
  options.observations = await loadObservations(listingUrl);

  try {
    const result = await withDeadline(
      analyzeListing(listingUrl, options),
      POLICY.pipelineTimeoutMs,
    );

    // One more point in this ad's price history. Time-limited and unable to
    // fail the request — a database hiccup must never cost the buyer a result.
    await recordObservation({
      listingUrl: result.target?.listingUrl || listingUrl,
      price: result.target?.price,
      source: result.marketplace?.id,
    });

    return json(result);
  } catch (error) {
    if (error instanceof AnalysisError) {
      return json(
        {
          error: error.message,
          hint: error.hint,
          code: error.code,
          details: error.details,
        },
        error.status,
      );
    }

    console.error("market-analysis: unexpected failure", error);
    return json(
      {
        error:
          "Die Analyse ist unerwartet fehlgeschlagen. Bitte erneut versuchen.",
        hint: process.env.NODE_ENV === "development" ? String(error?.message) : null,
      },
      500,
    );
  }
}

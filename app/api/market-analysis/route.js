import OpenAI from "openai";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

// API-only market research. This route never launches a browser and never
// fetches marketplace pages directly. Perplexity Search supplies URLs and
// indexed text; OpenAI only converts that evidence into structured data.

const OPENAI_MODEL = process.env.OPENAI_MARKET_MODEL || "gpt-5-mini";
const PERPLEXITY_SEARCH_ENDPOINT = "https://api.perplexity.ai/search";
const PIPELINE_TIMEOUT_MS = 150_000;

const MARKETPLACES = [
  { id: "AUTOSCOUT24", name: "AutoScout24", domain: "autoscout24.de" },
  { id: "MOBILE_DE", name: "mobile.de", domain: "mobile.de" },
  { id: "KLEINANZEIGEN", name: "Kleinanzeigen", domain: "kleinanzeigen.de" },
];

const POLICY = Object.freeze({
  maximumRawResults: 24,
  maximumFinalComparables: 8,
  minimumComparableScore: 50,
  maximumAgeGapMonths: 60,
  maximumMileageGapKm: 120_000,
  maximumMileageRatio: 4,
  searchTimeoutMs: 35_000,
  searchRetries: 3,
  defaultPreparationCosts: 500,
  defaultRepairReserve: 700,
  defaultWarrantyReserve: 400,
  defaultNegotiationReserve: 500,
  minimumDealerMargin: 1_500,
  expectedSalePriceFactor: 0.975,
  adjustmentPerYear: 700,
  adjustmentPer10kKm: 170,
  adjustmentPer10Ps: 80,
  privateToDealerAdjustment: 700,
});

const TRACKING_PARAMETERS = new Set([
  "source",
  "position",
  "utm_source",
  "utm_medium",
  "utm_campaign",
  "utm_term",
  "utm_content",
  "ref",
  "referrer",
  "ipc",
  "ipl",
  "ap_tier",
]);

const nullableString = { anyOf: [{ type: "string" }, { type: "null" }] };
const nullableNumber = { anyOf: [{ type: "number" }, { type: "null" }] };

const vehicleProperties = {
  title: nullableString,
  make: nullableString,
  model: nullableString,
  generation: nullableString,
  variant: nullableString,
  price: nullableNumber,
  firstRegistration: nullableString,
  mileageKm: nullableNumber,
  fuelType: nullableString,
  transmission: nullableString,
  powerPs: nullableNumber,
  powerKw: nullableNumber,
  engineCapacityCcm: nullableNumber,
  tuvUntil: nullableString,
  serviceHistory: { type: "string", enum: ["YES", "NO", "UNKNOWN"] },
  accidentStatus: {
    type: "string",
    enum: ["ACCIDENT_FREE", "DAMAGED", "REPAIRED_DAMAGE", "UNKNOWN"],
  },
  damageDescription: nullableString,
  sellerType: { type: "string", enum: ["DEALER", "PRIVATE", "UNKNOWN"] },
  bodyType: nullableString,
  color: nullableString,
  location: nullableString,
  confidence: { type: "integer", minimum: 0, maximum: 100 },
  missingFields: {
    type: "array",
    maxItems: 20,
    items: { type: "string" },
  },
};

const targetVehicleSchema = {
  type: "object",
  additionalProperties: false,
  properties: vehicleProperties,
  required: Object.keys(vehicleProperties),
};

const candidateProperties = {
  resultIndex: { type: "integer", minimum: 0 },
  title: nullableString,
  make: nullableString,
  model: nullableString,
  generation: nullableString,
  variant: nullableString,
  price: nullableNumber,
  firstRegistration: nullableString,
  mileageKm: nullableNumber,
  fuelType: nullableString,
  transmission: nullableString,
  powerPs: nullableNumber,
  sellerType: { type: "string", enum: ["DEALER", "PRIVATE", "UNKNOWN"] },
  bodyType: nullableString,
  location: nullableString,
  evidence: nullableString,
};

const comparableExtractionSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    candidates: {
      type: "array",
      maxItems: POLICY.maximumRawResults,
      items: {
        type: "object",
        additionalProperties: false,
        properties: candidateProperties,
        required: Object.keys(candidateProperties),
      },
    },
    warnings: {
      type: "array",
      maxItems: 10,
      items: { type: "string" },
    },
  },
  required: ["candidates", "warnings"],
};

const explanationSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    headline: { type: "string" },
    summary: { type: "string" },
    marketExplanation: { type: "string" },
    dealerExplanation: { type: "string" },
    reasons: { type: "array", maxItems: 6, items: { type: "string" } },
    risks: { type: "array", maxItems: 6, items: { type: "string" } },
    questionsForSeller: {
      type: "array",
      maxItems: 8,
      items: { type: "string" },
    },
  },
  required: [
    "headline",
    "summary",
    "marketExplanation",
    "dealerExplanation",
    "reasons",
    "risks",
    "questionsForSeller",
  ],
};

function json(data, status = 200) {
  return Response.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function cleanString(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  const normalized = String(value)
    .replace(/[^\d,.-]/g, "")
    .replace(/\.(?=\d{3}(?:\D|$))/g, "")
    .replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function clamp(value, minimum, maximum) {
  return Math.min(maximum, Math.max(minimum, value));
}

function roundMoney(value, interval = 50) {
  return Number.isFinite(value)
    ? Math.round(value / interval) * interval
    : null;
}

function average(values) {
  const usable = values.filter(Number.isFinite);
  return usable.length
    ? usable.reduce((sum, value) => sum + value, 0) / usable.length
    : null;
}

function median(values) {
  const usable = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!usable.length) return null;
  const middle = Math.floor(usable.length / 2);
  return usable.length % 2
    ? usable[middle]
    : (usable[middle - 1] + usable[middle]) / 2;
}

function percentile(values, percentage) {
  const usable = values.filter(Number.isFinite).sort((a, b) => a - b);
  if (!usable.length) return null;
  const index = (usable.length - 1) * percentage;
  const lower = Math.floor(index);
  const upper = Math.ceil(index);
  if (lower === upper) return usable[lower];
  return usable[lower] + (usable[upper] - usable[lower]) * (index - lower);
}

function weightedAverage(entries) {
  const usable = entries.filter(
    ({ value, weight }) =>
      Number.isFinite(value) && Number.isFinite(weight) && weight > 0,
  );
  if (!usable.length) return null;
  const weightSum = usable.reduce((sum, entry) => sum + entry.weight, 0);
  return (
    usable.reduce((sum, entry) => sum + entry.value * entry.weight, 0) /
    weightSum
  );
}

function standardDeviation(values) {
  const usable = values.filter(Number.isFinite);
  if (usable.length < 2) return null;
  const mean = average(usable);
  const variance = average(usable.map((value) => Math.pow(value - mean, 2)));
  return Math.sqrt(variance);
}

function normalizeText(value) {
  return cleanString(value)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function textTokens(value) {
  return new Set(
    normalizeText(value)
      .split(" ")
      .filter((token) => token.length > 1),
  );
}

function tokenSimilarity(first, second) {
  const a = textTokens(first);
  const b = textTokens(second);
  if (!a.size || !b.size) return 0;
  const intersection = [...a].filter((token) => b.has(token)).length;
  return (2 * intersection) / (a.size + b.size);
}

function sameNormalizedText(first, second) {
  const a = normalizeText(first);
  const b = normalizeText(second);
  return Boolean(a && b && (a === b || a.includes(b) || b.includes(a)));
}

function registrationToMonths(value) {
  const text = cleanString(value);
  let match = text.match(/(0?[1-9]|1[0-2])[./-]((?:19|20)\d{2})/);
  if (match) return Number(match[2]) * 12 + Number(match[1]) - 1;
  match = text.match(/((?:19|20)\d{2})/);
  return match ? Number(match[1]) * 12 + 5 : null;
}

function detectMarketplace(rawUrl) {
  try {
    const hostname = new URL(rawUrl).hostname
      .toLowerCase()
      .replace(/^www\./, "");
    return (
      MARKETPLACES.find(
        ({ domain }) => hostname === domain || hostname.endsWith(`.${domain}`),
      ) || null
    );
  } catch {
    return null;
  }
}

function detectSource(rawUrl) {
  return detectMarketplace(rawUrl)?.id || "UNKNOWN";
}

function cleanTrackingParameters(rawUrl) {
  try {
    const url = new URL(rawUrl);
    for (const parameter of TRACKING_PARAMETERS)
      url.searchParams.delete(parameter);
    url.hash = "";
    return url.toString();
  } catch {
    return cleanString(rawUrl);
  }
}

function isDirectListingUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    const hostname = url.hostname.toLowerCase();
    const pathname = url.pathname.toLowerCase();

    if (hostname.includes("autoscout24") && pathname.includes("/angebote/"))
      return true;
    if (
      hostname.includes("mobile.de") &&
      (pathname.includes("/auto-inserat/") ||
        (pathname.includes("/fahrzeuge/details.html") &&
          url.searchParams.has("id")))
    ) {
      return true;
    }
    if (hostname.includes("kleinanzeigen") && pathname.includes("/s-anzeige/"))
      return true;
    return false;
  } catch {
    return false;
  }
}

function safeListingUrl(rawUrl, requiredDomain = null) {
  try {
    const url = new URL(cleanString(rawUrl).replace(/&amp;/g, "&"));
    if (!["http:", "https:"].includes(url.protocol)) return null;

    const marketplace = detectMarketplace(url.toString());
    if (
      !marketplace ||
      (requiredDomain && marketplace.domain !== requiredDomain)
    )
      return null;
    const cleaned = cleanTrackingParameters(url.toString());
    return isDirectListingUrl(cleaned) ? cleaned : null;
  } catch {
    return null;
  }
}

function listingIdentity(rawUrl) {
  try {
    const url = new URL(cleanTrackingParameters(rawUrl));
    const marketplace = detectMarketplace(url.toString());
    const hostname = url.hostname.toLowerCase().replace(/^www\./, "");
    const pathname = url.pathname.toLowerCase().replace(/\/+$/, "");

    if (marketplace?.id === "MOBILE_DE") {
      const id = url.searchParams.get("id");
      if (id) return `mobile:${id}`;
    }

    const uuid = pathname.match(
      /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i,
    )?.[0];
    if (uuid) return `${marketplace?.id || hostname}:${uuid.toLowerCase()}`;

    return `${hostname}${pathname}`;
  } catch {
    return normalizeText(rawUrl);
  }
}

function validateMarketplaceUrl(rawUrl) {
  const value = cleanString(rawUrl);
  if (!value) throw new Error("Bitte einen Fahrzeug-Link eingeben.");

  let parsed;
  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Der Fahrzeug-Link ist ungültig.");
  }

  if (!["http:", "https:"].includes(parsed.protocol)) {
    throw new Error("Nur HTTP- und HTTPS-Links werden unterstützt.");
  }
  if (!detectMarketplace(value)) {
    throw new Error(
      "Bitte einen Link von AutoScout24, mobile.de oder Kleinanzeigen verwenden.",
    );
  }
  if (!isDirectListingUrl(value)) {
    throw new Error(
      "Bitte den direkten Link zu einer einzelnen Fahrzeuganzeige verwenden.",
    );
  }

  return cleanTrackingParameters(value);
}

function listingIdentifier(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return (
      url.searchParams.get("id") ||
      url.pathname.match(/[0-9a-f]{8}-[0-9a-f-]{27,}/i)?.[0] ||
      url.pathname.split("/").filter(Boolean).pop() ||
      rawUrl
    );
  } catch {
    return rawUrl;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function withTimeout(promise, timeoutMs, label) {
  let timer;
  const timeout = new Promise((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(
            `${label} hat nach ${Math.round(timeoutMs / 1000)} Sekunden nicht geantwortet.`,
          ),
        ),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([promise, timeout]);
  } finally {
    clearTimeout(timer);
  }
}

function openAIOutputText(response) {
  if (response?.output_text) return response.output_text;
  return (response?.output || [])
    .flatMap((item) => item?.content || [])
    .filter((part) => part?.type === "output_text")
    .map((part) => part.text)
    .join("");
}

function sanitizeSearchResults(data, requiredDomain = null) {
  const raw = Array.isArray(data?.results) ? data.results : [];
  const seen = new Set();
  const results = [];

  for (const item of raw) {
    const url = safeListingUrl(item?.url, requiredDomain);
    if (!url) continue;
    const identity = listingIdentity(url);
    if (!identity || seen.has(identity)) continue;
    seen.add(identity);
    results.push({
      title: cleanString(item?.title).slice(0, 500),
      url,
      snippet: cleanString(item?.snippet).slice(0, 8_000),
      date: cleanString(item?.date) || null,
      lastUpdated: cleanString(item?.last_updated) || null,
    });
  }

  return results;
}

async function perplexitySearch({ query, domains, maxResults = 10 }) {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY fehlt.");
  }

  let lastError = null;

  for (let attempt = 0; attempt < POLICY.searchRetries; attempt += 1) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), POLICY.searchTimeoutMs);

    try {
      const response = await fetch(PERPLEXITY_SEARCH_ENDPOINT, {
        method: "POST",
        cache: "no-store",
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          query,
          country: "DE",
          max_results: clamp(maxResults, 1, 20),
          search_context_size: "high",
          search_language_filter: ["de"],
          search_domain_filter: domains,
        }),
      });

      const raw = await response.text();

      if (response.ok) {
        try {
          return JSON.parse(raw);
        } catch {
          throw new Error("Perplexity Search lieferte ungültiges JSON.");
        }
      }

      const retryable = response.status === 429 || response.status >= 500;
      lastError = new Error(
        `Perplexity Search HTTP ${response.status}: ${raw.slice(0, 300)}`,
      );

      if (!retryable || attempt === POLICY.searchRetries - 1) throw lastError;

      const retryAfter = Number(response.headers.get("retry-after"));
      const waitMs = Number.isFinite(retryAfter)
        ? retryAfter * 1000
        : 1_500 * Math.pow(2, attempt);
      await delay(waitMs);
    } catch (error) {
      lastError =
        error?.name === "AbortError"
          ? new Error("Perplexity Search hat zu lange gebraucht.")
          : error;

      if (
        attempt === POLICY.searchRetries - 1 ||
        error?.name !== "AbortError"
      ) {
        if (!/HTTP (429|5\d\d)/.test(lastError?.message || "")) throw lastError;
      }

      if (attempt < POLICY.searchRetries - 1) {
        await delay(1_500 * Math.pow(2, attempt));
      }
    } finally {
      clearTimeout(timer);
    }
  }

  throw lastError || new Error("Perplexity Search ist fehlgeschlagen.");
}

function openAIClient() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY fehlt.");
  return new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}

async function extractTargetVehicle(listingUrl) {
  const marketplace = detectMarketplace(listingUrl);
  const identifier = listingIdentifier(listingUrl);
  const identity = listingIdentity(listingUrl);

  const queries = [
    `Exakte Fahrzeuganzeige ${listingUrl} Kennung ${identifier}. Preis, Erstzulassung, Kilometerstand, Motor und Ausstattung.`,
    `Fahrzeuganzeige Kennung "${identifier}" auf ${marketplace.domain}`,
  ];

  let results = [];

  for (const query of queries) {
    const data = await perplexitySearch({
      query,
      domains: [marketplace.domain],
      maxResults: 8,
    });
    results = sanitizeSearchResults(data, marketplace.domain);
    if (results.some((result) => listingIdentity(result.url) === identity))
      break;
    await delay(700);
  }

  const exactResults = results.filter(
    (result) => listingIdentity(result.url) === identity,
  );

  if (!exactResults.length) {
    throw new Error(
      "Die genaue Zielanzeige wurde im Suchindex nicht gefunden. Die Anzeige ist möglicherweise neu, abgelaufen oder nicht indexiert.",
    );
  }

  const evidence = exactResults.map((result, index) => ({
    index,
    title: result.title,
    url: result.url,
    snippet: result.snippet,
    lastUpdated: result.lastUpdated,
  }));

  const client = openAIClient();
  const response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions: [
      "Extrahiere ausschließlich Daten der angegebenen deutschen Fahrzeuganzeige.",
      "Verwende nur die bereitgestellten Suchbelege.",
      "Erfinde keine Werte und verwende null oder UNKNOWN, wenn etwas nicht belegt ist.",
      "Finanzierungsraten sind kein Fahrzeugpreis.",
    ].join(" "),
    input: `
Strukturiere die Zielanzeige.

ORIGINAL-URL:
${listingUrl}

SUCHBELEGE:
${JSON.stringify(evidence, null, 2)}

Regeln:
- Erstzulassung/EZ als MM/YYYY oder YYYY ausgeben.
- Kilometerstand als Zahl in km.
- Leistung als PS beziehungsweise kW.
- "unfallfrei" nur bei ausdrücklichem Beleg als ACCIDENT_FREE markieren.
- "Scheckheftgepflegt" als serviceHistory YES markieren.
- confidence bewertet nur die Vollständigkeit der Suchbelege.
`,
    text: {
      format: {
        type: "json_schema",
        name: "target_vehicle",
        strict: true,
        schema: targetVehicleSchema,
      },
    },
  });

  const output = openAIOutputText(response);
  if (!output)
    throw new Error("OpenAI konnte die Zielanzeige nicht strukturieren.");

  const vehicle = JSON.parse(output);
  vehicle.listingUrl = listingUrl;
  vehicle.source = marketplace.id;
  vehicle.price = numberOrNull(vehicle.price);
  vehicle.mileageKm = numberOrNull(vehicle.mileageKm);
  vehicle.powerPs = numberOrNull(vehicle.powerPs);
  vehicle.powerKw = numberOrNull(vehicle.powerKw);
  vehicle.engineCapacityCcm = numberOrNull(vehicle.engineCapacityCcm);

  if (!vehicle.make || !vehicle.model || !vehicle.price) {
    throw new Error(
      "Marke, Modell oder Angebotspreis fehlen im Suchindex. Für eine sichere Analyse werden diese drei Angaben benötigt.",
    );
  }

  return {
    vehicle,
    model: response?.model || OPENAI_MODEL,
    evidenceCount: exactResults.length,
  };
}

function targetSearchDescription(target) {
  return [
    target.make,
    target.model,
    target.variant,
    target.generation,
    target.fuelType,
    target.transmission,
    target.powerPs ? `${target.powerPs} PS` : null,
    target.firstRegistration ? `EZ ${target.firstRegistration}` : null,
    target.mileageKm ? `${Math.round(target.mileageKm / 1000)}000 km` : null,
  ]
    .filter(Boolean)
    .join(" ");
}

async function collectComparableSearchResults(target) {
  const domains = MARKETPLACES.map((marketplace) => marketplace.domain);
  const exactDescription = targetSearchDescription(target);
  const queries = [
    `${exactDescription} Gebrauchtwagen kaufen Deutschland aktuelle Angebote Preis`,
    `${target.make} ${target.model} ${target.fuelType || ""} ${target.transmission || ""} Gebrauchtwagen Angebote Deutschland`,
  ];

  const collected = [];
  const seen = new Set([listingIdentity(target.listingUrl)]);
  const warnings = [];

  for (let index = 0; index < queries.length; index += 1) {
    if (index === 1 && collected.length >= 12) break;

    try {
      const data = await perplexitySearch({
        query: queries[index],
        domains,
        maxResults: 20,
      });
      const results = sanitizeSearchResults(data);

      for (const result of results) {
        const identity = listingIdentity(result.url);
        if (seen.has(identity)) continue;
        seen.add(identity);
        collected.push(result);
        if (collected.length >= POLICY.maximumRawResults) break;
      }
    } catch (error) {
      warnings.push(
        error?.message || "Eine Vergleichssuche ist fehlgeschlagen.",
      );
    }

    if (collected.length < POLICY.maximumRawResults) await delay(900);
  }

  if (!collected.length) {
    throw new Error(
      "Die Such-API hat keine direkten Vergleichsanzeigen gefunden. Bitte später erneut versuchen.",
    );
  }

  return { results: collected, warnings };
}

async function extractComparableCandidates(searchResults, target) {
  const evidence = searchResults.map((result, index) => ({
    resultIndex: index,
    title: result.title,
    url: result.url,
    snippet: result.snippet,
    lastUpdated: result.lastUpdated,
  }));

  const client = openAIClient();
  const response = await client.responses.create({
    model: OPENAI_MODEL,
    instructions: [
      "Du strukturierst deutsche Gebrauchtwagen-Suchergebnisse.",
      "Nutze ausschließlich die gelieferten Belege.",
      "Gib für jeden Kandidaten den resultIndex des Belegs zurück.",
      "Erfinde niemals URLs oder Fahrzeugdaten.",
      "Überspringe Suchseiten, Ratgeber, Neuwagen-Konfiguratoren und offensichtlich andere Modelle.",
    ].join(" "),
    input: `
Extrahiere geeignete Vergleichsfahrzeuge für dieses Zielauto:
${JSON.stringify(target, null, 2)}

SUCHERGEBNISSE:
${JSON.stringify(evidence, null, 2)}

Regeln:
- Nur vollständige beworbene Barpreise, keine Monatsraten.
- Fehlende Werte als null oder UNKNOWN.
- Kandidaten mit anderem Modell nicht aufnehmen.
- Das Zielauto selbst nicht aufnehmen.
- evidence kurz und konkret auf Deutsch formulieren.
`,
    text: {
      format: {
        type: "json_schema",
        name: "comparable_vehicles",
        strict: true,
        schema: comparableExtractionSchema,
      },
    },
  });

  const output = openAIOutputText(response);
  if (!output)
    throw new Error("OpenAI konnte die Vergleichsdaten nicht strukturieren.");

  const parsed = JSON.parse(output);
  const usedIndexes = new Set();
  const candidates = [];

  for (const candidate of parsed.candidates || []) {
    const resultIndex = Number(candidate.resultIndex);
    const sourceResult = searchResults[resultIndex];
    if (
      !Number.isInteger(resultIndex) ||
      !sourceResult ||
      usedIndexes.has(resultIndex)
    )
      continue;
    usedIndexes.add(resultIndex);

    candidates.push({
      ...candidate,
      price: numberOrNull(candidate.price),
      mileageKm: numberOrNull(candidate.mileageKm),
      powerPs: numberOrNull(candidate.powerPs),
      listingUrl: sourceResult.url,
      directListingUrl: sourceResult.url,
      source: detectSource(sourceResult.url),
      marketplace: detectMarketplace(sourceResult.url)?.name || "Unbekannt",
    });
  }

  return {
    candidates,
    warnings: Array.isArray(parsed.warnings) ? parsed.warnings : [],
    model: response?.model || OPENAI_MODEL,
  };
}

function vehicleIdentityText(vehicle) {
  return [
    vehicle.make,
    vehicle.model,
    vehicle.generation,
    vehicle.variant,
    vehicle.title,
  ]
    .filter(Boolean)
    .join(" ");
}

function validateCandidate(candidate, target) {
  if (
    !candidate.listingUrl ||
    listingIdentity(candidate.listingUrl) === listingIdentity(target.listingUrl)
  ) {
    return "Die Anzeige ist das Zielauto selbst.";
  }

  const price = numberOrNull(candidate.price);
  if (price === null || price < 500 || price > 500_000) {
    return "Kein plausibler vollständiger Fahrzeugpreis.";
  }

  const title = vehicleIdentityText(candidate);
  if (!sameNormalizedText(candidate.make || title, target.make))
    return "Andere Fahrzeugmarke.";
  if (!sameNormalizedText(candidate.model || title, target.model))
    return "Anderes Fahrzeugmodell.";

  if (
    candidate.fuelType &&
    target.fuelType &&
    normalizeText(candidate.fuelType) !== "unknown" &&
    !sameNormalizedText(candidate.fuelType, target.fuelType)
  ) {
    return "Abweichende Kraftstoffart.";
  }

  const targetRegistration = registrationToMonths(target.firstRegistration);
  const candidateRegistration = registrationToMonths(
    candidate.firstRegistration,
  );
  if (
    targetRegistration !== null &&
    candidateRegistration !== null &&
    Math.abs(targetRegistration - candidateRegistration) >
      POLICY.maximumAgeGapMonths
  ) {
    return "Erstzulassung liegt zu weit vom Zielauto entfernt.";
  }

  const targetMileage = numberOrNull(target.mileageKm);
  const candidateMileage = numberOrNull(candidate.mileageKm);
  if (targetMileage !== null && candidateMileage !== null) {
    const gap = Math.abs(targetMileage - candidateMileage);
    const ratio =
      Math.max(targetMileage, candidateMileage) /
      Math.max(10_000, Math.min(targetMileage, candidateMileage));
    if (
      gap > POLICY.maximumMileageGapKm ||
      ratio > POLICY.maximumMileageRatio
    ) {
      return "Kilometerstand ist zu unterschiedlich.";
    }
  }

  return null;
}

function scoreCandidate(candidate, target) {
  let score = 0;
  const differences = [];
  const identitySimilarity = tokenSimilarity(
    vehicleIdentityText(candidate),
    vehicleIdentityText(target),
  );
  score += Math.round(identitySimilarity * 15);

  if (sameNormalizedText(candidate.make, target.make)) score += 15;
  if (sameNormalizedText(candidate.model, target.model)) score += 25;

  if (candidate.variant && target.variant) {
    const similarity = tokenSimilarity(candidate.variant, target.variant);
    score += Math.round(similarity * 10);
    if (similarity < 0.4)
      differences.push(`Andere Variante: ${candidate.variant}`);
  } else {
    score += 3;
  }

  if (candidate.fuelType && target.fuelType) {
    if (sameNormalizedText(candidate.fuelType, target.fuelType)) score += 10;
    else differences.push(`Kraftstoff: ${candidate.fuelType}`);
  } else {
    score += 4;
  }

  if (candidate.transmission && target.transmission) {
    if (sameNormalizedText(candidate.transmission, target.transmission))
      score += 8;
    else differences.push(`Getriebe: ${candidate.transmission}`);
  } else {
    score += 3;
  }

  const targetRegistration = registrationToMonths(target.firstRegistration);
  const candidateRegistration = registrationToMonths(
    candidate.firstRegistration,
  );
  if (targetRegistration !== null && candidateRegistration !== null) {
    const gap = Math.abs(targetRegistration - candidateRegistration);
    score += gap <= 6 ? 15 : gap <= 12 ? 12 : gap <= 24 ? 8 : gap <= 36 ? 5 : 2;
    if (gap > 6)
      differences.push(`${Math.round(gap / 12)} Jahr(e) EZ-Abweichung`);
  } else {
    score += 4;
  }

  const targetMileage = numberOrNull(target.mileageKm);
  const candidateMileage = numberOrNull(candidate.mileageKm);
  if (targetMileage !== null && candidateMileage !== null) {
    const gap = Math.abs(targetMileage - candidateMileage);
    score +=
      gap <= 10_000
        ? 12
        : gap <= 25_000
          ? 9
          : gap <= 50_000
            ? 6
            : gap <= 75_000
              ? 3
              : 1;
    if (gap > 10_000)
      differences.push(`${Math.round(gap / 1000)}.000 km Abweichung`);
  } else {
    score += 3;
  }

  const targetPower = numberOrNull(target.powerPs);
  const candidatePower = numberOrNull(candidate.powerPs);
  if (targetPower !== null && candidatePower !== null) {
    const gap = Math.abs(targetPower - candidatePower);
    score += gap <= 5 ? 5 : gap <= 15 ? 3 : 0;
    if (gap > 5) differences.push(`${Math.round(gap)} PS Abweichung`);
  } else {
    score += 2;
  }

  return {
    score: clamp(Math.round(score), 0, 100),
    differences: differences.slice(0, 6),
  };
}

function calculateAdjustedPrice(candidate, target) {
  const originalPrice = numberOrNull(candidate.price);
  if (originalPrice === null) return { adjustedPrice: null, adjustments: [] };

  let adjustment = 0;
  const adjustments = [];
  const targetRegistration = registrationToMonths(target.firstRegistration);
  const candidateRegistration = registrationToMonths(
    candidate.firstRegistration,
  );

  if (targetRegistration !== null && candidateRegistration !== null) {
    const amount =
      ((targetRegistration - candidateRegistration) / 12) *
      POLICY.adjustmentPerYear;
    if (Math.abs(amount) >= 100) {
      adjustment += amount;
      adjustments.push(
        amount > 0 ? "Zielauto ist neuer" : "Vergleich ist neuer",
      );
    }
  }

  const targetMileage = numberOrNull(target.mileageKm);
  const candidateMileage = numberOrNull(candidate.mileageKm);
  if (targetMileage !== null && candidateMileage !== null) {
    const amount =
      ((candidateMileage - targetMileage) / 10_000) * POLICY.adjustmentPer10kKm;
    if (Math.abs(amount) >= 75) {
      adjustment += amount;
      adjustments.push(
        amount > 0
          ? "Vergleich hat mehr Kilometer"
          : "Vergleich hat weniger Kilometer",
      );
    }
  }

  const targetPower = numberOrNull(target.powerPs);
  const candidatePower = numberOrNull(candidate.powerPs);
  if (targetPower !== null && candidatePower !== null) {
    const amount =
      ((targetPower - candidatePower) / 10) * POLICY.adjustmentPer10Ps;
    if (Math.abs(amount) >= 50) {
      adjustment += amount;
      adjustments.push(
        amount > 0
          ? "Zielauto hat mehr Leistung"
          : "Vergleich hat mehr Leistung",
      );
    }
  }

  if (candidate.sellerType === "PRIVATE" && target.sellerType === "DEALER") {
    adjustment += POLICY.privateToDealerAdjustment;
    adjustments.push("Privatangebot auf Händlerniveau angepasst");
  } else if (
    candidate.sellerType === "DEALER" &&
    target.sellerType === "PRIVATE"
  ) {
    adjustment -= POLICY.privateToDealerAdjustment;
    adjustments.push("Händlerangebot auf Privatniveau angepasst");
  }

  const maximum = originalPrice * 0.25;
  adjustment = clamp(adjustment, -maximum, maximum);
  return {
    adjustedPrice: roundMoney(originalPrice + adjustment),
    adjustments,
  };
}

function prepareComparables(candidates, target) {
  const accepted = [];
  const rejected = [];
  const seen = new Set();

  for (const candidate of candidates) {
    const identity = listingIdentity(candidate.listingUrl);
    if (seen.has(identity)) continue;
    seen.add(identity);

    const validationReason = validateCandidate(candidate, target);
    if (validationReason) {
      rejected.push({
        title: candidate.title,
        listingUrl: candidate.listingUrl,
        reason: validationReason,
      });
      continue;
    }

    const scored = scoreCandidate(candidate, target);
    if (scored.score < POLICY.minimumComparableScore) {
      rejected.push({
        title: candidate.title,
        listingUrl: candidate.listingUrl,
        reason: `Vergleichsscore ${scored.score}/100 ist zu niedrig.`,
      });
      continue;
    }

    const price = calculateAdjustedPrice(candidate, target);
    let valuationWeight = Math.pow(scored.score / 100, 2) * 100;
    if (!candidate.firstRegistration) valuationWeight *= 0.7;
    if (candidate.mileageKm === null) valuationWeight *= 0.7;
    if (candidate.sellerType === "UNKNOWN") valuationWeight *= 0.9;

    accepted.push({
      ...candidate,
      sourceType: "DIRECT_LISTING",
      similarityScore: scored.score,
      valuationWeight: Number(Math.max(1, valuationWeight).toFixed(2)),
      adjustedPrice: price.adjustedPrice,
      mainDifferences: scored.differences,
      comparisonReason: `Gleiches Modell; Ähnlichkeit ${scored.score}/100.`,
      adjustmentExplanation: price.adjustments.length
        ? price.adjustments.join(", ")
        : "Keine wesentliche Preisbereinigung erforderlich.",
    });
  }

  return { accepted, rejected };
}

function removePriceOutliers(comparables) {
  if (comparables.length < 4) return { accepted: comparables, rejected: [] };
  const prices = comparables
    .map((item) => item.adjustedPrice)
    .filter(Number.isFinite);
  const q1 = percentile(prices, 0.25);
  const q3 = percentile(prices, 0.75);
  const iqr = q3 - q1;
  const lower = q1 - 1.5 * iqr;
  const upper = q3 + 1.5 * iqr;
  const accepted = [];
  const rejected = [];

  for (const comparable of comparables) {
    if (comparable.adjustedPrice < lower || comparable.adjustedPrice > upper) {
      rejected.push({
        title: comparable.title,
        listingUrl: comparable.listingUrl,
        reason: "Preis liegt außerhalb der robusten Vergleichsspanne.",
      });
    } else {
      accepted.push(comparable);
    }
  }
  return { accepted, rejected };
}

function chooseBestComparables(comparables) {
  return [...comparables]
    .sort(
      (a, b) =>
        b.similarityScore - a.similarityScore ||
        b.valuationWeight - a.valuationWeight,
    )
    .slice(0, POLICY.maximumFinalComparables);
}

function calculateMarketStatistics(comparables, target) {
  const originalPrices = comparables
    .map((item) => item.price)
    .filter(Number.isFinite);
  const adjustedPrices = comparables
    .map((item) => item.adjustedPrice)
    .filter(Number.isFinite);
  const weightedPrice = weightedAverage(
    comparables.map((item) => ({
      value: item.adjustedPrice,
      weight: item.valuationWeight,
    })),
  );
  const weightedMarketPrice = roundMoney(
    weightedPrice === null
      ? median(adjustedPrices)
      : weightedPrice * 0.55 + median(adjustedPrices) * 0.45,
  );
  const deviation = standardDeviation(adjustedPrices);
  const spread =
    weightedMarketPrice === null ? null : clamp(deviation || 700, 500, 1_500);

  return {
    comparableCount: comparables.length,
    directListingCount: comparables.length,
    snippetCount: 0,
    minimumPrice: originalPrices.length ? Math.min(...originalPrices) : null,
    maximumPrice: originalPrices.length ? Math.max(...originalPrices) : null,
    averagePrice: roundMoney(average(originalPrices)),
    medianPrice: roundMoney(median(originalPrices)),
    weightedMarketPrice,
    estimatedRetailPriceFrom:
      weightedMarketPrice === null
        ? null
        : roundMoney(weightedMarketPrice - spread),
    estimatedRetailPriceTo:
      weightedMarketPrice === null
        ? null
        : roundMoney(weightedMarketPrice + spread),
    priceDifferenceToMarket:
      weightedMarketPrice !== null && numberOrNull(target.price) !== null
        ? roundMoney(weightedMarketPrice - target.price)
        : null,
    averageSimilarity: comparables.length
      ? Math.round(average(comparables.map((item) => item.similarityScore)))
      : null,
    priceStandardDeviation: roundMoney(deviation),
    explanation: "",
  };
}

function estimateCostReserve(target) {
  let preparation = POLICY.defaultPreparationCosts;
  let repair = POLICY.defaultRepairReserve;
  let warranty = POLICY.defaultWarrantyReserve;

  if (target.accidentStatus === "DAMAGED") repair += 1_500;
  else if (target.accidentStatus === "REPAIRED_DAMAGE") repair += 500;
  else if (target.accidentStatus === "UNKNOWN") repair += 200;
  if (!target.tuvUntil || normalizeText(target.tuvUntil) === "unknown")
    repair += 250;
  if (target.serviceHistory !== "YES") repair += 200;

  const mileage = numberOrNull(target.mileageKm);
  if (mileage !== null && mileage > 120_000) {
    repair += 300;
    warranty += 200;
  }
  if (mileage !== null && mileage > 180_000) {
    repair += 400;
    warranty += 300;
  }

  return {
    preparation: roundMoney(preparation),
    repair: roundMoney(repair),
    warranty: roundMoney(warranty),
  };
}

function calculateDealerAssessment(target, marketStatistics) {
  const marketPrice = numberOrNull(marketStatistics.weightedMarketPrice);
  const askingPrice = numberOrNull(target.price);
  const empty = {
    recommendedPurchasePriceFrom: null,
    recommendedPurchasePriceTo: null,
    negotiationTarget: null,
    absoluteMaximumPurchasePrice: null,
    estimatedPreparationCosts: null,
    estimatedRepairReserve: null,
    estimatedWarrantyReserve: null,
    negotiationReserve: POLICY.defaultNegotiationReserve,
    targetGrossMargin: POLICY.minimumDealerMargin,
    assumedSellingPrice: null,
    estimatedProfitAtAskingPrice: null,
    returnOnInvestmentPercent: null,
    explanation: "",
  };
  if (marketPrice === null || askingPrice === null) return empty;

  const costs = estimateCostReserve(target);
  const assumedSellingPrice = roundMoney(
    marketPrice * POLICY.expectedSalePriceFactor,
  );
  const operatingReserve =
    costs.preparation +
    costs.repair +
    costs.warranty +
    POLICY.defaultNegotiationReserve;
  const absoluteMaximumPurchasePrice = roundMoney(
    assumedSellingPrice - operatingReserve - POLICY.minimumDealerMargin,
  );
  const negotiationTarget = roundMoney(absoluteMaximumPurchasePrice - 500);
  const estimatedProfitAtAskingPrice = roundMoney(
    assumedSellingPrice - askingPrice - operatingReserve,
  );

  return {
    recommendedPurchasePriceFrom: roundMoney(
      absoluteMaximumPurchasePrice - 1_000,
    ),
    recommendedPurchasePriceTo: absoluteMaximumPurchasePrice,
    negotiationTarget,
    absoluteMaximumPurchasePrice,
    estimatedPreparationCosts: costs.preparation,
    estimatedRepairReserve: costs.repair,
    estimatedWarrantyReserve: costs.warranty,
    negotiationReserve: POLICY.defaultNegotiationReserve,
    targetGrossMargin: POLICY.minimumDealerMargin,
    assumedSellingPrice,
    estimatedProfitAtAskingPrice,
    returnOnInvestmentPercent:
      askingPrice > 0
        ? Number(
            ((estimatedProfitAtAskingPrice / askingPrice) * 100).toFixed(1),
          )
        : null,
    explanation: "",
  };
}

function calculateConfidence(target, comparables, statistics, warnings) {
  let confidence = 20;
  confidence += Math.min(36, comparables.length * 6);
  confidence += Math.round((statistics.averageSimilarity || 0) * 0.22);
  confidence += Math.round((numberOrNull(target.confidence) || 0) * 0.12);
  confidence -= (target.missingFields?.length || 0) * 2;
  confidence -= warnings.length * 2;
  if (comparables.length < 3) confidence = Math.min(confidence, 45);
  if ((statistics.averageSimilarity || 0) < 60)
    confidence = Math.min(confidence, 58);
  // Search-index evidence is useful but not the same as opening every live page.
  return clamp(Math.round(confidence), 20, 82);
}

function determineRating(confidence, assessment, statistics) {
  if (
    statistics.comparableCount < 2 ||
    !Number.isFinite(assessment.estimatedProfitAtAskingPrice)
  ) {
    return "INSUFFICIENT_DATA";
  }
  if (confidence < 40) return "INSUFFICIENT_DATA";
  const profit = assessment.estimatedProfitAtAskingPrice;
  if (profit >= POLICY.minimumDealerMargin + 750) return "VERY_GOOD";
  if (profit >= POLICY.minimumDealerMargin) return "GOOD";
  if (profit >= 0) return "CONDITIONAL";
  return "TOO_EXPENSIVE";
}

function defaultHeadline(rating) {
  if (rating === "VERY_GOOD")
    return "Sehr guter Händler-Deal mit belastbarer Marge";
  if (rating === "GOOD")
    return "Guter Händler-Deal bei bestätigtem Fahrzeugzustand";
  if (rating === "CONDITIONAL")
    return "Nur mit Preisverhandlung und genauer Prüfung interessant";
  if (rating === "TOO_EXPENSIVE")
    return "Für den gewerblichen Weiterverkauf zu teuer";
  return "Für eine sichere Händlerentscheidung fehlen belastbare Daten";
}

function fallbackExplanation({
  target,
  statistics,
  assessment,
  rating,
  warnings,
}) {
  return {
    headline: defaultHeadline(rating),
    summary:
      statistics.comparableCount >= 2
        ? `Die Bewertung basiert auf ${statistics.comparableCount} passenden Suchergebnissen und einer konservativen Händlerkalkulation.`
        : "Für eine belastbare Preisbewertung wurden nicht genügend Vergleichsangebote gefunden.",
    marketExplanation:
      statistics.weightedMarketPrice !== null
        ? `Der gewichtete Marktpreis beträgt ${statistics.weightedMarketPrice} €. Alters-, Kilometer- und Leistungsunterschiede wurden berücksichtigt.`
        : "Ein belastbarer Marktpreis konnte nicht berechnet werden.",
    dealerExplanation:
      assessment.absoluteMaximumPurchasePrice !== null
        ? `Das absolute Einkaufslimit beträgt ${assessment.absoluteMaximumPurchasePrice} € einschließlich Kostenreserven und Mindestmarge.`
        : "Ohne Marktwert ist keine sichere Einkaufskalkulation möglich.",
    reasons: [
      `${statistics.comparableCount} passende Vergleichsangebote berücksichtigt.`,
      statistics.averageSimilarity !== null
        ? `Durchschnittliche Ähnlichkeit: ${statistics.averageSimilarity}%.`
        : "Ähnlichkeit nicht berechenbar.",
    ],
    risks: [
      "Suchindex-Daten können zeitverzögert sein; Preise und Verfügbarkeit in den Originalanzeigen prüfen.",
      ...(target.missingFields || [])
        .slice(0, 3)
        .map((field) => `Fehlende Zielangabe: ${field}.`),
      ...warnings.slice(0, 2),
    ].slice(0, 6),
    questionsForSeller: [
      "Ist das Fahrzeug noch verfügbar und ist der angegebene Preis der Barpreis?",
      "Sind Unfallschäden oder Nachlackierungen bekannt?",
      "Gibt es ein vollständiges Serviceheft und Wartungsrechnungen?",
      "Welche technischen oder optischen Mängel bestehen?",
      "Sind beide Fahrzeugschlüssel vorhanden?",
    ],
  };
}

async function generateExplanation(context) {
  const fallback = fallbackExplanation(context);

  try {
    const client = openAIClient();
    const response = await client.responses.create({
      model: OPENAI_MODEL,
      instructions: [
        "Du bist ein professioneller deutscher Gebrauchtwagen-Händleranalyst.",
        "Erkläre ausschließlich die bereits berechneten Daten.",
        "Ändere keine Zahl und erfinde keine Fakten.",
        "Schreibe knapp, praktisch und auf Deutsch.",
      ].join(" "),
      input: `
ZIELFAHRZEUG:
${JSON.stringify(context.target, null, 2)}

VERGLEICHE:
${JSON.stringify(
  context.comparables.map((item) => ({
    title: item.title,
    price: item.price,
    adjustedPrice: item.adjustedPrice,
    firstRegistration: item.firstRegistration,
    mileageKm: item.mileageKm,
    similarityScore: item.similarityScore,
  })),
  null,
  2,
)}

MARKTSTATISTIK:
${JSON.stringify(context.statistics, null, 2)}

HÄNDLERKALKULATION:
${JSON.stringify(context.assessment, null, 2)}

RATING: ${context.rating}
KONFIDENZ: ${context.confidence}

WICHTIG: Die Daten stammen aus Perplexity-Suchergebnissen. Weise darauf hin,
dass Aktualität und Verfügbarkeit in den Originalanzeigen geprüft werden müssen.
`,
      text: {
        format: {
          type: "json_schema",
          name: "dealer_analysis_explanation",
          strict: true,
          schema: explanationSchema,
        },
      },
    });

    const output = openAIOutputText(response);
    return output ? JSON.parse(output) : fallback;
  } catch (error) {
    console.error(
      "Explanation generation failed: " + (error?.message || String(error)),
    );
    return fallback;
  }
}

async function runProfessionalAnalysis(listingUrl) {
  const normalizedTarget = await extractTargetVehicle(listingUrl);
  const target = normalizedTarget.vehicle;

  const search = await collectComparableSearchResults(target);
  const extracted = await extractComparableCandidates(search.results, target);
  const warnings = [
    "Die Analyse verwendet Suchindex-Daten; Preis und Verfügbarkeit jeder Originalanzeige müssen geprüft werden.",
    ...search.warnings,
    ...extracted.warnings,
  ];

  const prepared = prepareComparables(extracted.candidates, target);
  const outliers = removePriceOutliers(prepared.accepted);
  const rejectedCandidates = [...prepared.rejected, ...outliers.rejected];
  const comparables = chooseBestComparables(outliers.accepted);
  const marketStatistics = calculateMarketStatistics(comparables, target);
  const dealerAssessment = calculateDealerAssessment(target, marketStatistics);
  const confidence = calculateConfidence(
    target,
    comparables,
    marketStatistics,
    warnings,
  );
  marketStatistics.confidence = confidence;
  const rating = determineRating(
    confidence,
    dealerAssessment,
    marketStatistics,
  );

  const explanation = await generateExplanation({
    target,
    comparables,
    statistics: marketStatistics,
    assessment: dealerAssessment,
    rating,
    confidence,
    warnings,
  });

  marketStatistics.explanation = explanation.marketExplanation;
  dealerAssessment.explanation = explanation.dealerExplanation;

  const overallWarnings = [...new Set(warnings)];
  if (comparables.length < 3) {
    overallWarnings.push(
      "Weniger als drei geeignete Vergleichsfahrzeuge wurden gefunden.",
    );
  }
  if (target.missingFields?.length) {
    overallWarnings.push(
      `Fehlende Zielangaben: ${target.missingFields.join(", ")}.`,
    );
  }

  return {
    targetVehicle: target,
    comparableVehicles: comparables,
    rejectedCandidates: rejectedCandidates.slice(0, 25),
    marketStatistics,
    dealerAssessment,
    recommendation: {
      rating,
      confidence,
      headline: explanation.headline || defaultHeadline(rating),
      summary: explanation.summary,
      reasons: explanation.reasons,
      risks: explanation.risks,
      questionsForSeller: explanation.questionsForSeller,
    },
    overallWarnings: [...new Set(overallWarnings)].slice(0, 15),
    research: {
      searchedMarketplaces: MARKETPLACES.map((marketplace) => marketplace.name),
      rawCandidateCount: search.results.length,
      acceptedComparableCount: comparables.length,
      rejectedCandidateCount: rejectedCandidates.length,
      targetExtraction: {
        method: "PERPLEXITY_SEARCH_AND_OPENAI",
        openAIModel: normalizedTarget.model,
        evidenceCount: normalizedTarget.evidenceCount,
      },
      comparableExtraction: {
        method: "PERPLEXITY_SEARCH_AND_OPENAI",
        openAIModel: extracted.model,
      },
    },
    searchedAt: new Date().toISOString(),
  };
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return json({ error: "Nicht autorisiert." }, 401);

    let body;
    try {
      body = await request.json();
    } catch {
      return json({ error: "Ungültige JSON-Anfrage." }, 400);
    }

    let listingUrl;
    try {
      listingUrl = validateMarketplaceUrl(body?.url);
    } catch (error) {
      return json(
        { error: error?.message || "Ungültiger Fahrzeug-Link." },
        400,
      );
    }

    try {
      const result = await withTimeout(
        runProfessionalAnalysis(listingUrl),
        PIPELINE_TIMEOUT_MS,
        "Die vollständige Marktanalyse",
      );
      return json(result);
    } catch (error) {
      console.error(
        "Market analysis failed: " + (error?.message || String(error)),
      );
      const timeout = /hat nach \d+ Sekunden nicht geantwortet/.test(
        error?.message || "",
      );
      return json(
        { error: error?.message || "Die Marktanalyse ist fehlgeschlagen." },
        timeout ? 504 : 500,
      );
    }
  } catch (error) {
    console.error(
      "Market analysis route error: " + (error?.message || String(error)),
    );
    return json(
      { error: error?.message || "Die Marktanalyse ist fehlgeschlagen." },
      500,
    );
  }
}

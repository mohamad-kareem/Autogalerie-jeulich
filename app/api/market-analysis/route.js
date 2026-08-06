import OpenAI from "openai";
import { chromium } from "playwright";
import { getServerSession } from "next-auth";

import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 180;

const OPENAI_MODEL = process.env.OPENAI_MARKET_MODEL || "gpt-5-nano";

const PERPLEXITY_MODEL = process.env.PERPLEXITY_MODEL || "sonar-pro";

const PERPLEXITY_ENDPOINT = "https://api.perplexity.ai/chat/completions";

const SUPPORTED_DOMAINS = ["autoscout24.de", "mobile.de", "kleinanzeigen.de"];

const MARKETPLACES = [
  {
    name: "AutoScout24",
    domain: "autoscout24.de",
  },
  {
    name: "mobile.de",
    domain: "mobile.de",
  },
  {
    name: "Kleinanzeigen",
    domain: "kleinanzeigen.de",
  },
];

const BROWSER_TIMEOUT_MS = 45_000;
const PERPLEXITY_TIMEOUT_MS = 45_000;

// -----------------------------------------------------------------------------
// JSON schemas
// -----------------------------------------------------------------------------

const nullableString = {
  anyOf: [{ type: "string" }, { type: "null" }],
};

const nullableNumber = {
  anyOf: [{ type: "number" }, { type: "null" }],
};

const vehicleSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
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

    serviceHistory: {
      type: "string",
      enum: ["YES", "NO", "UNKNOWN"],
    },

    accidentStatus: {
      type: "string",
      enum: ["ACCIDENT_FREE", "DAMAGED", "REPAIRED_DAMAGE", "UNKNOWN"],
    },

    damageDescription: nullableString,

    sellerType: {
      type: "string",
      enum: ["DEALER", "PRIVATE", "UNKNOWN"],
    },

    bodyType: nullableString,
    color: nullableString,
    location: nullableString,
    listingUrl: nullableString,

    confidence: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },

    missingFields: {
      type: "array",
      maxItems: 20,
      items: {
        type: "string",
      },
    },
  },

  required: [
    "title",
    "make",
    "model",
    "generation",
    "variant",
    "price",
    "firstRegistration",
    "mileageKm",
    "fuelType",
    "transmission",
    "powerPs",
    "powerKw",
    "engineCapacityCcm",
    "tuvUntil",
    "serviceHistory",
    "accidentStatus",
    "damageDescription",
    "sellerType",
    "bodyType",
    "color",
    "location",
    "listingUrl",
    "confidence",
    "missingFields",
  ],
};

const marketplaceCandidateSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
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

    sellerType: {
      type: "string",
      enum: ["DEALER", "PRIVATE", "UNKNOWN"],
    },

    bodyType: nullableString,
    location: nullableString,

    listingUrl: nullableString,

    evidence: nullableString,
  },

  required: [
    "title",
    "make",
    "model",
    "generation",
    "variant",
    "price",
    "firstRegistration",
    "mileageKm",
    "fuelType",
    "transmission",
    "powerPs",
    "sellerType",
    "bodyType",
    "location",
    "listingUrl",
    "evidence",
  ],
};

const marketplaceSearchSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    candidates: {
      type: "array",
      maxItems: 8,
      items: marketplaceCandidateSchema,
    },

    warnings: {
      type: "array",
      maxItems: 8,
      items: {
        type: "string",
      },
    },
  },

  required: ["candidates", "warnings"],
};

const comparableSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    title: nullableString,
    make: nullableString,
    model: nullableString,
    generation: nullableString,
    variant: nullableString,

    price: nullableNumber,
    adjustedPrice: nullableNumber,

    firstRegistration: nullableString,
    mileageKm: nullableNumber,

    fuelType: nullableString,
    transmission: nullableString,
    powerPs: nullableNumber,

    sellerType: {
      type: "string",
      enum: ["DEALER", "PRIVATE", "UNKNOWN"],
    },

    bodyType: nullableString,
    location: nullableString,

    listingUrl: nullableString,

    sourceType: {
      type: "string",
      enum: ["DIRECT_LISTING", "SEARCH_SNIPPET"],
    },

    similarityScore: {
      type: "integer",
      minimum: 0,
      maximum: 100,
    },

    comparisonReason: {
      type: "string",
    },

    adjustmentExplanation: {
      type: "string",
    },

    mainDifferences: {
      type: "array",
      maxItems: 6,
      items: {
        type: "string",
      },
    },
  },

  required: [
    "title",
    "make",
    "model",
    "generation",
    "variant",
    "price",
    "adjustedPrice",
    "firstRegistration",
    "mileageKm",
    "fuelType",
    "transmission",
    "powerPs",
    "sellerType",
    "bodyType",
    "location",
    "listingUrl",
    "sourceType",
    "similarityScore",
    "comparisonReason",
    "adjustmentExplanation",
    "mainDifferences",
  ],
};

const finalAnalysisSchema = {
  type: "object",
  additionalProperties: false,

  properties: {
    comparableVehicles: {
      type: "array",
      maxItems: 6,
      items: comparableSchema,
    },

    rejectedCandidates: {
      type: "array",
      maxItems: 18,

      items: {
        type: "object",
        additionalProperties: false,

        properties: {
          title: nullableString,
          listingUrl: nullableString,

          reason: {
            type: "string",
          },
        },

        required: ["title", "listingUrl", "reason"],
      },
    },

    marketStatistics: {
      type: "object",
      additionalProperties: false,

      properties: {
        comparableCount: {
          type: "integer",
          minimum: 0,
        },

        minimumPrice: nullableNumber,
        maximumPrice: nullableNumber,
        averagePrice: nullableNumber,
        medianPrice: nullableNumber,
        weightedMarketPrice: nullableNumber,

        estimatedRetailPriceFrom: nullableNumber,
        estimatedRetailPriceTo: nullableNumber,

        priceDifferenceToMarket: nullableNumber,

        explanation: {
          type: "string",
        },
      },

      required: [
        "comparableCount",
        "minimumPrice",
        "maximumPrice",
        "averagePrice",
        "medianPrice",
        "weightedMarketPrice",
        "estimatedRetailPriceFrom",
        "estimatedRetailPriceTo",
        "priceDifferenceToMarket",
        "explanation",
      ],
    },

    dealerAssessment: {
      type: "object",
      additionalProperties: false,

      properties: {
        recommendedPurchasePriceFrom: nullableNumber,
        recommendedPurchasePriceTo: nullableNumber,

        negotiationTarget: nullableNumber,
        absoluteMaximumPurchasePrice: nullableNumber,

        estimatedPreparationCosts: nullableNumber,
        estimatedRepairReserve: nullableNumber,
        estimatedWarrantyReserve: nullableNumber,

        estimatedProfitAtAskingPrice: nullableNumber,

        explanation: {
          type: "string",
        },
      },

      required: [
        "recommendedPurchasePriceFrom",
        "recommendedPurchasePriceTo",
        "negotiationTarget",
        "absoluteMaximumPurchasePrice",
        "estimatedPreparationCosts",
        "estimatedRepairReserve",
        "estimatedWarrantyReserve",
        "estimatedProfitAtAskingPrice",
        "explanation",
      ],
    },

    recommendation: {
      type: "object",
      additionalProperties: false,

      properties: {
        rating: {
          type: "string",
          enum: [
            "VERY_GOOD",
            "GOOD",
            "CONDITIONAL",
            "TOO_EXPENSIVE",
            "INSUFFICIENT_DATA",
          ],
        },

        confidence: {
          type: "integer",
          minimum: 0,
          maximum: 100,
        },

        headline: {
          type: "string",
        },

        summary: {
          type: "string",
        },

        reasons: {
          type: "array",
          maxItems: 8,
          items: {
            type: "string",
          },
        },

        risks: {
          type: "array",
          maxItems: 8,
          items: {
            type: "string",
          },
        },

        questionsForSeller: {
          type: "array",
          maxItems: 10,
          items: {
            type: "string",
          },
        },
      },

      required: [
        "rating",
        "confidence",
        "headline",
        "summary",
        "reasons",
        "risks",
        "questionsForSeller",
      ],
    },

    overallWarnings: {
      type: "array",
      maxItems: 12,
      items: {
        type: "string",
      },
    },
  },

  required: [
    "comparableVehicles",
    "rejectedCandidates",
    "marketStatistics",
    "dealerAssessment",
    "recommendation",
    "overallWarnings",
  ],
};

// -----------------------------------------------------------------------------
// General helpers
// -----------------------------------------------------------------------------

function json(data, status = 200) {
  return Response.json(data, {
    status,
  });
}

function cleanString(value) {
  return String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();
}

function numberOrNull(value) {
  if (value === null || value === undefined || value === "") {
    return null;
  }

  if (typeof value === "number") {
    return Number.isFinite(value) ? value : null;
  }

  let text = String(value).trim().replace(/\s/g, "").replace(/[€$£]/g, "");

  if (/^\d{1,3}(\.\d{3})+(,\d+)?$/.test(text)) {
    text = text.replace(/\./g, "").replace(",", ".");
  } else if (/^\d{1,3}(,\d{3})+(\.\d+)?$/.test(text)) {
    text = text.replace(/,/g, "");
  } else {
    text = text.replace(",", ".");
  }

  text = text.replace(/[^0-9.-]/g, "");

  const number = Number(text);

  return Number.isFinite(number) ? number : null;
}

function cleanTrackingParameters(rawUrl) {
  try {
    const url = new URL(rawUrl);

    const removable = [
      "source",
      "position",
      "utm_source",
      "utm_medium",
      "utm_campaign",
      "utm_term",
      "utm_content",
      "sort",
      "desc",
      "ref",
      "referrer",
      "source_otp",
      "order_bucket",
      "boost_level",
      "applied_boost_level",
      "relevance_adjustment",
      "boosting_product",
    ];

    for (const parameter of removable) {
      url.searchParams.delete(parameter);
    }

    url.hash = "";

    return url.toString();
  } catch {
    return cleanString(rawUrl);
  }
}

function validateMarketplaceUrl(rawUrl) {
  const value = cleanString(rawUrl);

  if (!value) {
    throw new Error("Bitte einen Fahrzeug-Link eingeben.");
  }

  let parsed;

  try {
    parsed = new URL(value);
  } catch {
    throw new Error("Der Fahrzeug-Link ist ungültig.");
  }

  if (parsed.protocol !== "https:" && parsed.protocol !== "http:") {
    throw new Error("Nur HTTP- und HTTPS-Links werden unterstützt.");
  }

  const hostname = parsed.hostname.toLowerCase().replace(/^www\./, "");

  const supported = SUPPORTED_DOMAINS.some(
    (domain) => hostname === domain || hostname.endsWith(`.${domain}`),
  );

  if (!supported) {
    throw new Error(
      "Bitte einen Link von AutoScout24, mobile.de oder Kleinanzeigen verwenden.",
    );
  }

  return cleanTrackingParameters(parsed.toString());
}

function detectSource(rawUrl) {
  const value = cleanString(rawUrl).toLowerCase();

  if (value.includes("autoscout24")) {
    return "AUTOSCOUT24";
  }

  if (value.includes("mobile.de")) {
    return "MOBILE_DE";
  }

  if (value.includes("kleinanzeigen")) {
    return "KLEINANZEIGEN";
  }

  return "UNKNOWN";
}

function normalizedUrl(rawUrl) {
  try {
    const url = new URL(cleanTrackingParameters(rawUrl));

    return `${url.hostname}${url.pathname}`
      .toLowerCase()
      .replace(/^www\./, "")
      .replace(/\/+$/, "");
  } catch {
    return cleanString(rawUrl)
      .toLowerCase()
      .replace(/[?#].*$/, "")
      .replace(/\/+$/, "");
  }
}

function isDirectListingUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);

    const hostname = url.hostname.toLowerCase();

    const pathname = url.pathname.toLowerCase();

    if (hostname.includes("autoscout24") && pathname.includes("/angebote/")) {
      return true;
    }

    if (
      hostname.includes("mobile.de") &&
      (pathname.includes("/fahrzeuge/details.html") ||
        pathname.includes("/auto-inserat/"))
    ) {
      return true;
    }

    if (
      hostname.includes("kleinanzeigen") &&
      pathname.includes("/s-anzeige/")
    ) {
      return true;
    }

    return false;
  } catch {
    return false;
  }
}

function parseUrlSlug(listingUrl) {
  try {
    const url = new URL(listingUrl);

    const parts = url.pathname.split("/").filter(Boolean);

    const offerIndex = parts.findIndex(
      (part) => part.toLowerCase() === "angebote",
    );

    let slug = offerIndex >= 0 ? parts[offerIndex + 1] : parts.at(-1);

    if (!slug) {
      return null;
    }

    slug = decodeURIComponent(slug)
      .replace(
        /-[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/i,
        "",
      )
      .replace(/-cat_[a-z0-9]+.*$/i, "")
      .replace(/-/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    return slug || null;
  } catch {
    return null;
  }
}

function openAIOutputText(response) {
  if (response?.output_text) {
    return response.output_text;
  }

  return (response?.output || [])
    .flatMap((item) => item?.content || [])
    .filter((part) => part?.type === "output_text")
    .map((part) => part.text)
    .join("");
}

async function withTimeout(promise, timeoutMs, name) {
  let timer;

  const timeoutPromise = new Promise((_, reject) => {
    timer = setTimeout(() => {
      reject(
        new Error(
          `${name} hat nach ${Math.round(
            timeoutMs / 1000,
          )} Sekunden nicht geantwortet.`,
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timer);
  }
}

// -----------------------------------------------------------------------------
// Browser extraction
// -----------------------------------------------------------------------------

async function acceptCookieBanner(page) {
  const labels = [
    "Alle akzeptieren",
    "Akzeptieren",
    "Zustimmen",
    "Accept all",
    "Accept",
  ];

  for (const label of labels) {
    try {
      const button = page
        .getByRole("button", {
          name: new RegExp(label, "i"),
        })
        .first();

      if (
        await button.isVisible({
          timeout: 800,
        })
      ) {
        await button.click({
          timeout: 2_000,
        });

        await page.waitForTimeout(700);

        return true;
      }
    } catch {
      // Continue trying other cookie-button labels.
    }
  }

  return false;
}

async function scrollRenderedPage(page) {
  await page.evaluate(async () => {
    await new Promise((resolve) => {
      let previousHeight = 0;
      let attempts = 0;

      const timer = setInterval(() => {
        window.scrollBy(0, 800);

        const currentHeight = document.body?.scrollHeight || 0;

        if (currentHeight === previousHeight) {
          attempts += 1;
        } else {
          attempts = 0;
        }

        previousHeight = currentHeight;

        const reachedBottom =
          window.scrollY + window.innerHeight >= currentHeight - 100;

        if (reachedBottom || attempts >= 5) {
          clearInterval(timer);
          resolve();
        }
      }, 180);
    });
  });
}

async function extractTargetWithBrowser(listingUrl) {
  let browser;
  let context;

  try {
    browser = await chromium.launch({
      headless: true,

      args: [
        "--disable-blink-features=AutomationControlled",
        "--disable-dev-shm-usage",
        "--no-sandbox",
      ],
    });

    context = await browser.newContext({
      locale: "de-DE",

      userAgent:
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) " +
        "AppleWebKit/537.36 (KHTML, like Gecko) " +
        "Chrome/131.0.0.0 Safari/537.36",

      viewport: {
        width: 1440,
        height: 1200,
      },

      extraHTTPHeaders: {
        "Accept-Language": "de-DE,de;q=0.9,en;q=0.7",
      },
    });

    const page = await context.newPage();

    await page.goto(listingUrl, {
      waitUntil: "domcontentloaded",
      timeout: BROWSER_TIMEOUT_MS,
    });

    await page.waitForTimeout(2_500);

    await acceptCookieBanner(page);

    await scrollRenderedPage(page);

    await page.waitForTimeout(1_500);

    const extracted = await page.evaluate(() => {
      function clean(value) {
        return String(value || "")
          .replace(/\s+/g, " ")
          .trim();
      }

      function meta(selector) {
        return clean(document.querySelector(selector)?.getAttribute("content"));
      }

      const jsonLd = [];

      document
        .querySelectorAll('script[type="application/ld+json"]')
        .forEach((script) => {
          try {
            jsonLd.push(JSON.parse(script.textContent));
          } catch {
            // Ignore invalid JSON-LD.
          }
        });

      const relevantScripts = [];

      document.querySelectorAll("script").forEach((script) => {
        const text = script.textContent || "";

        if (
          /mileage|kilometerstand|firstRegistration|erstzulassung|vehicle|price|transmission|leistung|power|hubraum/i.test(
            text,
          )
        ) {
          relevantScripts.push(text.slice(0, 80_000));
        }
      });

      const labels = [];

      document
        .querySelectorAll("dt, dd, li, p, span, div")
        .forEach((element) => {
          const text = clean(element.textContent);

          if (
            text &&
            text.length <= 220 &&
            /erstzulassung|kilometerstand|leistung|getriebe|hubraum|kraftstoff|tüv|hu|scheckheft|unfall|fahrzeughalter|verkäufer|standort|farbe|karosserie/i.test(
              text,
            )
          ) {
            labels.push(text);
          }
        });

      return {
        finalUrl: window.location.href,

        pageTitle:
          clean(document.querySelector("h1")?.textContent) ||
          meta('meta[property="og:title"]') ||
          clean(document.title),

        pageDescription:
          meta('meta[property="og:description"]') ||
          meta('meta[name="description"]'),

        visibleText: clean(document.body?.innerText).slice(0, 70_000),

        specificationText: [...new Set(labels)].slice(0, 250).join("\n"),

        jsonLd,

        relevantScripts: relevantScripts.slice(0, 8),
      };
    });

    const blockText = [
      extracted.pageTitle,
      extracted.pageDescription,
      extracted.visibleText,
    ]
      .filter(Boolean)
      .join(" ");

    const blocked =
      /captcha|access denied|unusual traffic|robot check|verify you are human|bot detection/i.test(
        blockText,
      );

    return {
      ok: !blocked,
      blocked,
      error: blocked
        ? "Der Marktplatz hat die automatische Browser-Abfrage blockiert."
        : null,
      ...extracted,
    };
  } catch (error) {
    return {
      ok: false,
      blocked: false,

      error: error?.message || "Browser-Extraktion fehlgeschlagen.",

      finalUrl: listingUrl,
      pageTitle: null,
      pageDescription: null,
      visibleText: "",
      specificationText: "",
      jsonLd: [],
      relevantScripts: [],
    };
  } finally {
    if (context) {
      await context.close();
    }

    if (browser) {
      await browser.close();
    }
  }
}

function createTargetEvidence(listingUrl, browserResult) {
  return {
    listingUrl,

    browserExtraction: {
      ok: browserResult.ok,
      blocked: browserResult.blocked,
      error: browserResult.error,
      finalUrl: browserResult.finalUrl,
    },

    pageTitle: browserResult.pageTitle || null,

    pageDescription: browserResult.pageDescription || null,

    specificationText: browserResult.specificationText || "",

    visiblePageText: browserResult.visibleText || "",

    jsonLd: browserResult.jsonLd || [],

    relevantApplicationScripts: browserResult.relevantScripts || [],

    urlSlug: parseUrlSlug(listingUrl),
  };
}

// -----------------------------------------------------------------------------
// OpenAI target extraction
// -----------------------------------------------------------------------------

async function normalizeTargetVehicle(targetEvidence) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY fehlt.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: OPENAI_MODEL,

    instructions:
      "Extract the exact target vehicle from supplied rendered marketplace evidence. Do not search the internet and never invent unsupported facts.",

    input: `
Extract and normalize the exact vehicle from this rendered marketplace evidence:

${JSON.stringify(targetEvidence, null, 2)}

EXTRACTION PRIORITY

1. Explicit target values from specificationText or visiblePageText.
2. Values clearly associated with the target advertisement in JSON-LD.
3. Values clearly associated with the target listing in application scripts.
4. Page title, description and URL slug.

EXTRACT

- title;
- make;
- model;
- generation;
- variant or trim;
- complete advertised cash price;
- first registration;
- mileage;
- fuel type;
- transmission;
- power in PS and kW;
- engine capacity;
- TÜV/HU;
- service history;
- accident status;
- damage description;
- seller type;
- body type;
- color;
- location.

GERMAN LABELS

- Erstzulassung or EZ means firstRegistration.
- Kilometerstand means mileageKm.
- Leistung means powerPs or powerKw.
- Getriebe means transmission.
- Hubraum means engineCapacityCcm.
- Kraftstoff means fuelType.
- HU or TÜV means tuvUntil.
- Händler means sellerType DEALER.
- Privatanbieter means sellerType PRIVATE.
- Scheckheftgepflegt means serviceHistory YES.
- Unfallfrei means accidentStatus ACCIDENT_FREE.

MAKE AND MODEL

Extract the obvious make and model from the page title or URL.

Examples:

- Ford Focus 1.0 Business means make Ford, model Focus.
- Opel Astra TwinTop means make Opel, model Astra.
- Volkswagen Golf 1.4 means make Volkswagen, model Golf.

IMPORTANT

- Use the full vehicle cash price, not a monthly financing rate.
- A value followed by km is mileage, not price.
- Ignore carousel vehicles, related vehicles and recommendations.
- Ignore financing examples.
- Ignore values that clearly belong to another advertisement.
- Do not invent unsupported facts.
- Use null or UNKNOWN when evidence is unavailable.
- confidence must be an integer from 0 to 100.
- listingUrl must equal the supplied target URL.
- missingFields must contain only genuinely missing important fields.
- All normalized text should be in German where appropriate.
`,

    text: {
      format: {
        type: "json_schema",
        name: "normalized_target_vehicle",
        strict: true,
        schema: vehicleSchema,
      },
    },
  });

  const output = openAIOutputText(response);

  if (!output) {
    throw new Error("OpenAI konnte die Zielanzeige nicht auswerten.");
  }

  const vehicle = JSON.parse(output);

  vehicle.listingUrl = targetEvidence.listingUrl;

  return {
    vehicle,

    model: response?.model || OPENAI_MODEL,

    usage: response?.usage || null,
  };
}

// -----------------------------------------------------------------------------
// Perplexity marketplace research
// -----------------------------------------------------------------------------

function buildMarketplacePrompt({ marketplace, targetVehicle, listingUrl }) {
  return `
Search ${marketplace.name} for active German used-car offers comparable to the target vehicle.

TARGET LISTING:
${listingUrl}

TARGET VEHICLE:
${JSON.stringify(targetVehicle, null, 2)}

Your task is marketplace research only.

Do not calculate market value.
Do not calculate dealer profit.
Do not make a purchase recommendation.

Return up to 8 possible candidates from ${marketplace.domain}.

SEARCH PRIORITY

1. Same make and model.
2. Same generation and body type.
3. Same fuel type.
4. Same transmission.
5. Similar engine and power.
6. Similar registration and mileage.

When some target fields are unknown, continue with the reliable fields.

A candidate may come from:

- a direct individual advertisement page; or
- a factual marketplace search-result snippet.

Do not return the target advertisement itself.

Do not return:

- vehicle parts;
- wanted advertisements;
- monthly financing prices;
- leasing-only monthly prices;
- unrelated models.

RULES

- Price must be the complete cash price.
- Never invent a URL.
- Never invent a price.
- Never invent mileage or specifications.
- Use null or UNKNOWN for unsupported values.
- Include short factual evidence.
- Return JSON only according to the schema.
`;
}

async function searchMarketplace({ marketplace, targetVehicle, listingUrl }) {
  if (!process.env.PERPLEXITY_API_KEY) {
    throw new Error("PERPLEXITY_API_KEY fehlt.");
  }

  const response = await fetch(PERPLEXITY_ENDPOINT, {
    method: "POST",
    cache: "no-store",

    headers: {
      Authorization: `Bearer ${process.env.PERPLEXITY_API_KEY}`,

      "Content-Type": "application/json",
    },

    body: JSON.stringify({
      model: PERPLEXITY_MODEL,

      messages: [
        {
          role: "system",

          content:
            "Search German used-car marketplaces accurately. Never invent advertisements, URLs, prices or specifications.",
        },

        {
          role: "user",

          content: buildMarketplacePrompt({
            marketplace,
            targetVehicle,
            listingUrl,
          }),
        },
      ],

      search_domain_filter: [marketplace.domain],

      search_language_filter: ["de"],

      web_search_options: {
        search_context_size: "medium",

        user_location: {
          country: "DE",
          region: "Nordrhein-Westfalen",
          city: "Jülich",
        },
      },

      temperature: 0.05,
      max_tokens: 2400,

      response_format: {
        type: "json_schema",

        json_schema: {
          name: `market_${marketplace.name
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "_")}`,

          schema: marketplaceSearchSchema,
        },
      },
    }),
  });

  const raw = await response.text();

  let payload;

  try {
    payload = JSON.parse(raw);
  } catch {
    throw new Error(`${marketplace.name} lieferte ungültiges JSON.`);
  }

  if (!response.ok) {
    throw new Error(
      payload?.error?.message ||
        payload?.message ||
        `${marketplace.name}: HTTP ${response.status}`,
    );
  }

  const content = payload?.choices?.[0]?.message?.content;

  if (!content) {
    throw new Error(`${marketplace.name} lieferte keinen Inhalt.`);
  }

  const parsed = typeof content === "string" ? JSON.parse(content) : content;

  return {
    marketplace: marketplace.name,

    candidates: parsed.candidates || [],

    warnings: parsed.warnings || [],

    model: payload?.model || PERPLEXITY_MODEL,

    searchResultCount: Array.isArray(payload?.search_results)
      ? payload.search_results.length
      : 0,

    usage: payload?.usage || null,
  };
}

function candidateIdentity(candidate, index) {
  if (candidate.listingUrl) {
    return normalizedUrl(candidate.listingUrl);
  }

  return [
    cleanString(candidate.title).toLowerCase(),

    numberOrNull(candidate.price) ?? "no-price",

    numberOrNull(candidate.mileageKm) ?? "no-mileage",

    candidate.firstRegistration || "no-registration",

    index,
  ].join("|");
}

async function searchAllMarketplaces({ targetVehicle, listingUrl }) {
  const settled = await Promise.allSettled(
    MARKETPLACES.map((marketplace) =>
      withTimeout(
        searchMarketplace({
          marketplace,
          targetVehicle,
          listingUrl,
        }),

        PERPLEXITY_TIMEOUT_MS,

        marketplace.name,
      ),
    ),
  );

  const rawCandidates = [];
  const warnings = [];
  const diagnostics = [];

  settled.forEach((result, index) => {
    const marketplace = MARKETPLACES[index];

    if (result.status === "fulfilled") {
      rawCandidates.push(
        ...result.value.candidates.map((candidate) => ({
          ...candidate,

          marketplace: marketplace.name,
        })),
      );

      warnings.push(...result.value.warnings);

      diagnostics.push({
        marketplace: marketplace.name,

        ok: true,

        candidateCount: result.value.candidates.length,

        searchResultCount: result.value.searchResultCount,

        model: result.value.model,

        error: null,
      });

      return;
    }

    const error = result.reason?.message || "Unbekannter Suchfehler.";

    warnings.push(`${marketplace.name}: ${error}`);

    diagnostics.push({
      marketplace: marketplace.name,

      ok: false,
      candidateCount: 0,
      searchResultCount: 0,
      model: PERPLEXITY_MODEL,
      error,
    });
  });

  const targetIdentity = normalizedUrl(listingUrl);

  const unique = [];
  const seen = new Set();

  for (let index = 0; index < rawCandidates.length; index += 1) {
    const candidate = rawCandidates[index];

    const rawUrl = cleanString(candidate.listingUrl);

    const cleanedUrl = rawUrl ? cleanTrackingParameters(rawUrl) : null;

    const directListing = cleanedUrl ? isDirectListingUrl(cleanedUrl) : false;

    const price = numberOrNull(candidate.price);

    const usefulSnippet =
      price !== null &&
      Boolean(
        candidate.title ||
        candidate.make ||
        candidate.model ||
        candidate.evidence,
      );

    if (!directListing && !usefulSnippet) {
      continue;
    }

    const identity = candidateIdentity(
      {
        ...candidate,
        listingUrl: cleanedUrl,
      },
      index,
    );

    if (cleanedUrl && identity === targetIdentity) {
      continue;
    }

    if (seen.has(identity)) {
      continue;
    }

    seen.add(identity);

    unique.push({
      title: candidate.title || null,

      make: candidate.make || null,

      model: candidate.model || null,

      generation: candidate.generation || null,

      variant: candidate.variant || null,

      price,

      firstRegistration: candidate.firstRegistration || null,

      mileageKm: numberOrNull(candidate.mileageKm),

      fuelType: candidate.fuelType || null,

      transmission: candidate.transmission || null,

      powerPs: numberOrNull(candidate.powerPs),

      sellerType: candidate.sellerType || "UNKNOWN",

      bodyType: candidate.bodyType || null,

      location: candidate.location || null,

      listingUrl: cleanedUrl,

      directListingUrl: directListing,

      marketplace: candidate.marketplace,

      evidence: candidate.evidence
        ? cleanString(candidate.evidence).slice(0, 500)
        : null,
    });
  }

  return {
    candidates: unique.slice(0, 15),

    warnings: [...new Set(warnings)].slice(0, 12),

    diagnostics,

    rawCandidateCount: rawCandidates.length,
  };
}

// -----------------------------------------------------------------------------
// OpenAI final analysis
// -----------------------------------------------------------------------------

async function analyzeMarketWithOpenAI({
  targetVehicle,
  candidates,
  researchWarnings,
}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY fehlt.");
  }

  const client = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  const response = await client.responses.create({
    model: OPENAI_MODEL,

    instructions:
      "Analyze only the supplied German used-car research. Select comparisons, calculate market value and dealer economics. Never invent advertisements or facts.",

    input: `
TARGET VEHICLE:

${JSON.stringify(targetVehicle, null, 2)}

MARKETPLACE CANDIDATES:

${JSON.stringify(candidates, null, 2)}

RESEARCH WARNINGS:

${JSON.stringify(researchWarnings, null, 2)}

Perform the complete vehicle market and dealer analysis.

IMPORTANT

JavaScript will not calculate similarity, market value, dealer margin or profit.
You must perform those tasks.

COMPARABLE SELECTION

- Same make and model are normally mandatory.
- Prefer the same generation and body type.
- Prefer the same fuel and transmission.
- Prefer similar engine, power, first registration and mileage.
- Reject the target listing itself.
- Reject duplicates.
- Reject unrelated models or materially different vehicle generations.
- Reject candidates without a plausible full cash price.
- Keep up to six strongest candidates.

CANDIDATE SOURCE TYPES

Each input candidate contains directListingUrl.

When directListingUrl is true:

- sourceType must be DIRECT_LISTING.

When directListingUrl is false:

- sourceType must be SEARCH_SNIPPET.
- The candidate may still be used when it has a plausible full price and enough identifying facts.
- Reduce confidence compared with a direct advertisement.
- listingUrl may contain a search page, but never describe it as a direct advertisement.

Never invent a direct URL.

PRICE ADJUSTMENT

For every accepted candidate:

- preserve its original price;
- estimate an adjusted price for the target;
- consider year;
- mileage;
- engine;
- power;
- transmission;
- fuel;
- body type;
- equipment;
- seller type;
- TÜV;
- service history;
- accident status;
- condition;
- explain the adjustment briefly.

MARKET STATISTICS

Calculate:

- comparison count;
- minimum original price;
- maximum original price;
- average original price;
- median original price;
- similarity-weighted market price;
- realistic target retail-price range;
- difference between target asking price and weighted market price.

Do not allow one extreme price to control the result.

DEALER ANALYSIS

Estimate:

- preparation and cleaning costs;
- immediate repair reserve;
- warranty or Gewährleistung reserve;
- recommended dealer purchase range;
- negotiation target;
- absolute maximum purchase price;
- expected profit if bought at the target asking price.

Expected profit must subtract:

- purchase price;
- preparation costs;
- repair reserve;
- warranty reserve.

When target asking price is unknown, estimatedProfitAtAskingPrice must be null.

DATA SUFFICIENCY

- Direct listings are stronger than search snippets.
- Three or more credible priced snippets may support a cautious market range.
- When fewer than two credible priced candidates remain, normally use INSUFFICIENT_DATA.
- When important target data is missing, lower confidence and widen the market range.
- Do not output confidence 0 merely because some fields are unknown.

CONFIDENCE

Return a whole-number percentage.

- 50 means fifty percent.
- Never return 0.5 for fifty percent.

LANGUAGE

All explanations, warnings, reasons, risks and questions must be in German.
`,

    text: {
      format: {
        type: "json_schema",

        name: "vehicle_market_analysis",

        strict: true,

        schema: finalAnalysisSchema,
      },
    },
  });

  const output = openAIOutputText(response);

  if (!output) {
    throw new Error("OpenAI hat keine Marktanalyse geliefert.");
  }

  return {
    analysis: JSON.parse(output),

    model: response?.model || OPENAI_MODEL,

    usage: response?.usage || null,
  };
}

// -----------------------------------------------------------------------------
// Fallback
// -----------------------------------------------------------------------------

function createFallbackAnalysis(warnings) {
  return {
    comparableVehicles: [],
    rejectedCandidates: [],

    marketStatistics: {
      comparableCount: 0,
      minimumPrice: null,
      maximumPrice: null,
      averagePrice: null,
      medianPrice: null,
      weightedMarketPrice: null,
      estimatedRetailPriceFrom: null,
      estimatedRetailPriceTo: null,
      priceDifferenceToMarket: null,

      explanation:
        "Es wurden nicht genügend belastbare Vergleichsangebote gefunden.",
    },

    dealerAssessment: {
      recommendedPurchasePriceFrom: null,

      recommendedPurchasePriceTo: null,

      negotiationTarget: null,

      absoluteMaximumPurchasePrice: null,

      estimatedPreparationCosts: null,

      estimatedRepairReserve: null,

      estimatedWarrantyReserve: null,

      estimatedProfitAtAskingPrice: null,

      explanation:
        "Ohne belastbare Vergleichspreise ist keine seriöse Händlerkalkulation möglich.",
    },

    recommendation: {
      rating: "INSUFFICIENT_DATA",

      confidence: 0,

      headline: "Nicht genügend Marktdaten",

      summary:
        "Die Analyse konnte keine ausreichend zuverlässige Marktgrundlage aufbauen.",

      reasons: [],

      risks: [
        "Der Marktwert kann ohne ausreichende Vergleichsangebote nicht zuverlässig bestimmt werden.",
      ],

      questionsForSeller: [],
    },

    overallWarnings: warnings.slice(0, 12),
  };
}

// -----------------------------------------------------------------------------
// Route
// -----------------------------------------------------------------------------

export async function POST(req) {
  const startedAt = Date.now();

  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return json(
        {
          success: false,
          error: "Unauthorized",
        },
        401,
      );
    }

    const body = await req.json();

    const listingUrl = validateMarketplaceUrl(body?.url);

    console.log("Market analysis started:", listingUrl);

    // 1. Render the exact target advertisement in Chromium.
    const browserResult = await extractTargetWithBrowser(listingUrl);

    const targetEvidence = createTargetEvidence(listingUrl, browserResult);

    // 2. OpenAI extracts structured target data from rendered page evidence.
    const normalizedTarget = await normalizeTargetVehicle(targetEvidence);

    const targetVehicle = {
      ...normalizedTarget.vehicle,

      listingUrl,
    };

    // 3. Perplexity searches each marketplace.
    const marketResearch = await searchAllMarketplaces({
      targetVehicle,
      listingUrl,
    });

    // 4. OpenAI performs all comparisons and dealer calculations.
    let finalResult;
    let finalAnalysisError = null;

    try {
      finalResult = await analyzeMarketWithOpenAI({
        targetVehicle,

        candidates: marketResearch.candidates,

        researchWarnings: marketResearch.warnings,
      });
    } catch (error) {
      finalAnalysisError =
        error?.message || "OpenAI-Marktanalyse fehlgeschlagen.";

      console.error("Final OpenAI analysis failed:", error);

      finalResult = {
        analysis: createFallbackAnalysis([
          ...marketResearch.warnings,

          `OpenAI: ${finalAnalysisError}`,
        ]),

        model: OPENAI_MODEL,

        usage: null,
      };
    }

    const analysis = finalResult.analysis;

    const candidateMap = new Map(
      marketResearch.candidates
        .filter((candidate) => candidate.listingUrl)
        .map((candidate) => [normalizedUrl(candidate.listingUrl), candidate]),
    );

    const comparableVehicles = (analysis.comparableVehicles || []).map(
      (vehicle) => {
        const cleanedUrl = vehicle.listingUrl
          ? cleanTrackingParameters(vehicle.listingUrl)
          : null;

        const originalCandidate = cleanedUrl
          ? candidateMap.get(normalizedUrl(cleanedUrl))
          : null;

        const directListing =
          originalCandidate?.directListingUrl ??
          vehicle.sourceType === "DIRECT_LISTING";

        return {
          ...vehicle,

          source: detectSource(cleanedUrl || originalCandidate?.listingUrl),

          listingUrl: directListing ? cleanedUrl : null,

          evidenceUrl: cleanedUrl,

          directListingUrl: directListing,
        };
      },
    );

    const warnings = [
      ...new Set([
        ...marketResearch.warnings,

        ...(analysis.overallWarnings || []),

        ...(browserResult.error
          ? [`Browser-Extraktion: ${browserResult.error}`]
          : []),

        ...(finalAnalysisError ? [`OpenAI: ${finalAnalysisError}`] : []),
      ]),
    ].slice(0, 12);

    return json({
      success: true,

      searchedAt: new Date().toISOString(),

      durationMs: Date.now() - startedAt,

      targetVehicle: {
        ...targetVehicle,

        source: detectSource(listingUrl),

        listingUrl,
      },

      comparableVehicles,

      rejectedComparables: analysis.rejectedCandidates || [],

      marketStatistics: analysis.marketStatistics,

      dealerAssessment: analysis.dealerAssessment,

      recommendation: analysis.recommendation,

      overallWarnings: warnings,

      sources: comparableVehicles.map((vehicle) => ({
        title: vehicle.title,

        url: vehicle.listingUrl || vehicle.evidenceUrl,

        direct: vehicle.directListingUrl,

        source: vehicle.source,
      })),

      debug: {
        architecture:
          "Playwright browser extraction → OpenAI target extraction → Perplexity marketplace searches → OpenAI final analysis",

        targetExtraction: {
          browserExtractionOk: browserResult.ok,

          blocked: browserResult.blocked,

          visibleTextLength: browserResult.visibleText?.length || 0,

          specificationTextLength: browserResult.specificationText?.length || 0,

          relevantScriptCount: browserResult.relevantScripts?.length || 0,

          jsonLdCount: browserResult.jsonLd?.length || 0,

          targetConfidence: targetVehicle.confidence,

          error: browserResult.error,
        },

        marketplaceSearches: marketResearch.diagnostics,

        rawCandidateCount: marketResearch.rawCandidateCount,

        discoveredCandidateCount: marketResearch.candidates.length,

        acceptedCandidateCount: comparableVehicles.length,

        rejectedCandidateCount: analysis.rejectedCandidates?.length || 0,

        providers: {
          perplexity: {
            model: PERPLEXITY_MODEL,
          },

          targetOpenAI: {
            model: normalizedTarget.model,

            usage: normalizedTarget.usage,
          },

          finalOpenAI: {
            model: finalResult.model,

            ok: !finalAnalysisError,

            error: finalAnalysisError,

            usage: finalResult.usage,
          },
        },
      },
    });
  } catch (error) {
    console.error("POST /api/market-analysis:", error);

    return json(
      {
        success: false,

        error:
          error?.message ||
          "Die Fahrzeuganalyse konnte nicht durchgeführt werden.",

        durationMs: Date.now() - startedAt,
      },
      500,
    );
  }
}

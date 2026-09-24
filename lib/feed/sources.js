/**
 * The portals, as seen by the new-listings feed.
 *
 * For each portal: the filter turned into its search link (sorted newest
 * first), and its result page read into one card shape. The page-reading
 * functions are pure string work — no imports — so they can be tested against
 * a real page as it is.
 *
 * Checked against the live sites (September 2026):
 *   AutoScout24   /lst?sort=age&desc=1&adage=1 …, results in __NEXT_DATA__
 *                 (props.pageProps.listings), private/dealer via custtype.
 *   Kleinanzeigen /s-autos/<plz>/…/c216l<ort-id>r<km>+autos.*, newest first
 *                 after a few paid "TOP" slots; ad numbers only ever grow.
 *   mobile.de     refuses server requests to its pages; only the official
 *                 Search API works, and only when the account has access.
 */

import { requestJson, request } from "../market/http";
import { makeSlug } from "../market/sources/autoscout24";
import { searchNewest as mobileSearchNewest, isConfigured as mobileConfigured } from "../market/sources/mobilede";

const AS24 = "https://www.autoscout24.de";
const KA = "https://www.kleinanzeigen.de";

/* ============================================================ AutoScout24 */

const AS24_FUEL = { PETROL: "B", DIESEL: "D", HYBRID: "2,3", ELECTRIC: "E", LPG: "L" };
const AS24_BODY = { SMALL: 1, CABRIO: 2, COUPE: 3, SUV: 4, ESTATE: 5, SEDAN: 6, VAN: 12, TRANSPORTER: 13 };
const AS24_GEAR = { MANUAL: "M", AUTOMATIC: "A" };

export function autoscoutUrl(f) {
  const path = f.make ? `/lst/${makeSlug(f.make)}` : "/lst";
  const p = new URLSearchParams({
    atype: "C",
    cy: "D",
    sort: "age",
    desc: "1",
    ustate: "N,U",
    // Only ads from the last day: the feed is about what just arrived.
    adage: "1",
    page: "1",
    size: "20",
  });
  if (f.hideDamaged) p.set("damaged_listing", "exclude");
  if (f.priceMin !== null) p.set("pricefrom", String(f.priceMin));
  if (f.priceMax !== null) p.set("priceto", String(f.priceMax));
  if (f.kmMin !== null) p.set("kmfrom", String(f.kmMin));
  if (f.kmMax !== null) p.set("kmto", String(f.kmMax));
  if (f.yearMin !== null) p.set("fregfrom", String(f.yearMin));
  if (f.yearMax !== null) p.set("fregto", String(f.yearMax));
  if (f.powerMin !== null || f.powerMax !== null) {
    p.set("powertype", "hp");
    if (f.powerMin !== null) p.set("powerfrom", String(f.powerMin));
    if (f.powerMax !== null) p.set("powerto", String(f.powerMax));
  }
  const fuels = f.fuels.map((id) => AS24_FUEL[id]).filter(Boolean);
  if (fuels.length) p.set("fuel", fuels.join(","));
  if (AS24_GEAR[f.gearbox]) p.set("gear", AS24_GEAR[f.gearbox]);
  const bodies = f.bodies.map((id) => AS24_BODY[id]).filter(Boolean);
  if (bodies.length) p.set("body", bodies.join(","));
  if (f.seller === "PRIVATE") p.set("custtype", "P");
  if (f.seller === "DEALER") p.set("custtype", "D");
  if (f.zip) {
    p.set("zip", f.zip);
    p.set("zipr", String(f.radius));
  }
  return `${AS24}${path}?${p.toString()}`;
}

const AS24_RATING = {
  1: { label: "Sehr guter Preis", tone: "good" },
  2: { label: "Guter Preis", tone: "good" },
  3: { label: "Fairer Preis", tone: "neutral" },
  4: { label: "Erhöhter Preis", tone: "bad" },
  5: { label: "Hoher Preis", tone: "bad" },
};

/** AutoScout24 result page → cards. Pure: no imports, no network. */
export function parseAutoScoutPage(html) {
  const match = String(html).match(
    /<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i,
  );
  if (!match) return { ok: false, items: [], error: "Seitenstruktur unerwartet (kein __NEXT_DATA__)." };

  let listings;
  try {
    listings = JSON.parse(match[1])?.props?.pageProps?.listings;
  } catch {
    return { ok: false, items: [], error: "Seitendaten nicht lesbar." };
  }
  if (!Array.isArray(listings)) return { ok: false, items: [], error: "Keine Trefferliste gefunden." };

  const num = (value) => {
    const digits = String(value ?? "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : null;
  };

  const items = [];
  for (const entry of listings) {
    if (!entry?.id || !entry?.url) continue;
    const vehicle = entry.vehicle || {};
    const details = Array.isArray(entry.vehicleDetails) ? entry.vehicleDetails : [];
    const detail = (name) => details.find((d) => d?.ariaLabel === name)?.data || null;

    const power = String(detail("Leistung") || "");
    const ps = power.match(/(\d{2,4})\s*PS/);
    const reg =
      (entry.tracking?.firstRegistration || "").replace("-", "/") ||
      (detail("Erstzulassung") || "");
    const location = entry.location || {};
    const sellerType = /private/i.test(entry.seller?.type || "")
      ? "PRIVATE"
      : entry.seller?.type
        ? "DEALER"
        : "UNKNOWN";

    const title = [vehicle.make, vehicle.model, vehicle.modelVersionInput]
      .filter(Boolean)
      .join(" ")
      .replace(/\s+/g, " ")
      .trim();

    const image = Array.isArray(entry.images) && entry.images[0]
      ? String(entry.images[0]).replace(/\/\d+x\d+\.webp$/, "/480x360.webp")
      : null;

    items.push({
      key: `AUTOSCOUT24:${entry.id}`,
      source: "AUTOSCOUT24",
      id: String(entry.id),
      numericId: null,
      url: new URL(entry.url, "https://www.autoscout24.de").toString(),
      title: title || "Fahrzeug",
      make: vehicle.make || null,
      model: vehicle.model || null,
      price: entry.price?.priceRaw ?? num(entry.tracking?.price),
      priceNote: null,
      mileageKm: num(entry.tracking?.mileage) ?? num(vehicle.mileageInKm),
      firstRegistration: /^\d{2}\/\d{4}$/.test(reg) ? reg : null,
      powerPs: ps ? Number(ps[1]) : null,
      fuel: vehicle.fuel || detail("Kraftstoff"),
      gearbox: vehicle.transmission || detail("Getriebe"),
      location: [location.zip, location.city].filter(Boolean).join(" ") || null,
      distanceKm: Number.isFinite(location.distanceToSearchLocationInKm)
        ? location.distanceToSearchLocationInKm
        : null,
      sellerType,
      image,
      rating: AS24_RATING[entry.price?.priceEvaluation] || null,
      postedAt: null,
      // Paid placements can be old ads; organic main results are the real list.
      promoted: entry.searchResultType ? entry.searchResultType !== "Organic" : false,
    });
  }

  return { ok: true, items, error: null };
}

/* ============================================================ Kleinanzeigen */

const KA_FUEL = { PETROL: "benzin", DIESEL: "diesel", HYBRID: "hybrid", ELECTRIC: "elektro", LPG: "lpg" };
const KA_BODY = {
  SMALL: "kleinwagen", SEDAN: "limousine", ESTATE: "kombi", SUV: "suv",
  VAN: "bus", COUPE: "coupe", CABRIO: "cabrio", TRANSPORTER: "andere",
};
const KA_GEAR = { MANUAL: "manuell", AUTOMATIC: "automatik" };
const KA_MAKE = {
  vw: "volkswagen", "mercedes": "mercedes_benz", "mercedes-benz": "mercedes_benz",
  "mercedes benz": "mercedes_benz", "alfa romeo": "alfa_romeo", "land rover": "land_rover",
  "škoda": "skoda", "citroën": "citroen", ds: "ds_automobiles",
};

function kaMake(make) {
  const key = String(make || "").trim().toLowerCase();
  if (!key) return null;
  return KA_MAKE[key] || key.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[\s-]+/g, "_");
}

// Kleinanzeigen needs its own id for a place; one lookup per postcode.
const kaPlaces = new Map();

async function kaPlaceId(zip) {
  if (!zip) return null;
  if (kaPlaces.has(zip)) return kaPlaces.get(zip);
  const result = await requestJson(`${KA}/s-ort-empfehlungen.json?query=${zip}`, {
    label: "Kleinanzeigen Ort",
    timeoutMs: 6_000,
    retries: 0,
  });
  const entries = Object.entries(result.data || {});
  const hit = entries.find(([, name]) => String(name).startsWith(zip)) || null;
  const id = hit ? hit[0].replace(/^_/, "") : null;
  if (id) kaPlaces.set(zip, id);
  return id;
}

/**
 * Kleinanzeigen takes one fuel and one body type per search. Several chosen →
 * one search per combination, at most four; beyond that the wider dimension
 * is dropped and the cards say what they are.
 */
export function kleinanzeigenUrls(f, placeId) {
  let fuels = f.fuels.map((id) => KA_FUEL[id]).filter(Boolean);
  let bodies = f.bodies.map((id) => KA_BODY[id]).filter(Boolean);
  if (!fuels.length) fuels = [null];
  if (!bodies.length) bodies = [null];
  while (fuels.length * bodies.length > 4) {
    if (bodies.length >= fuels.length) bodies = [null];
    else fuels = [null];
  }

  const urls = [];
  for (const fuel of fuels) {
    for (const body of new Set(bodies)) {
      const segments = ["s-autos"];
      if (f.zip && placeId) segments.push(f.zip);
      if (f.seller === "PRIVATE") segments.push("anbieter:privat");
      if (f.seller === "DEALER") segments.push("anbieter:gewerblich");
      segments.push("anzeige:angebote");
      if (f.priceMin !== null || f.priceMax !== null) {
        segments.push(`preis:${f.priceMin ?? ""}:${f.priceMax ?? ""}`);
      }

      const attributes = [];
      const range = (name, min, max) => {
        if (min !== null || max !== null) attributes.push(`autos.${name}:${min ?? ""}%2C${max ?? ""}`);
      };
      range("ez_i", f.yearMin, f.yearMax);
      range("km_i", f.kmMin, f.kmMax);
      range("power_i", f.powerMin, f.powerMax);
      if (fuel) attributes.push(`autos.fuel_s:${fuel}`);
      const make = kaMake(f.make);
      if (make) attributes.push(`autos.marke_s:${make}`);
      if (f.hideDamaged) attributes.push("autos.schaden_s:nein");
      if (KA_GEAR[f.gearbox]) attributes.push(`autos.shift_s:${KA_GEAR[f.gearbox]}`);
      if (body) attributes.push(`autos.typ_s:${body}`);
      attributes.sort();

      const category = `c216${f.zip && placeId ? `l${placeId}r${f.radius}` : ""}`;
      segments.push([category, ...attributes].join("+"));
      urls.push(`${KA}/${segments.join("/")}`);
    }
  }
  return urls;
}

/**
 * Kleinanzeigen result page → cards. Pure: no imports, no network.
 * `now` is only for tests; times on the page are German local time.
 */
export function parseKleinanzeigenPage(html, now = new Date()) {
  const text = String(html);
  const articles = text.match(/<article\b[^>]*data-adid=["']\d+["'][\s\S]*?<\/article>/gi) || [];

  const strip = (value) =>
    String(value || "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<svg[\s\S]*?<\/svg>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .replace(/&quot;/g, '"')
      .replace(/&#x27;|&#39;/g, "'")
      .replace(/\s+/g, " ")
      .trim();
  const num = (value) => {
    const digits = String(value ?? "").replace(/[^\d]/g, "");
    return digits ? Number(digits) : null;
  };

  // "Heute, 15:11" in Berlin → an exact instant, whatever the server's zone.
  const berlinInstant = (year, month, day, hour, minute) => {
    const guess = Date.UTC(year, month - 1, day, hour, minute);
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin",
      year: "numeric", month: "2-digit", day: "2-digit",
      hour: "2-digit", minute: "2-digit", hourCycle: "h23",
    }).formatToParts(new Date(guess));
    const get = (type) => Number(parts.find((part) => part.type === type)?.value);
    const shown = Date.UTC(get("year"), get("month") - 1, get("day"), get("hour"), get("minute"));
    return new Date(guess - (shown - guess)).toISOString();
  };
  const berlinToday = () => {
    const parts = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit",
    }).formatToParts(now);
    const get = (type) => Number(parts.find((part) => part.type === type)?.value);
    return { year: get("year"), month: get("month"), day: get("day") };
  };
  const postedAt = (plain) => {
    const relative = plain.match(/\b(Heute|Gestern),\s*(\d{1,2}):(\d{2})/);
    if (relative) {
      const today = berlinToday();
      const base = new Date(Date.UTC(today.year, today.month - 1, today.day));
      if (relative[1] === "Gestern") base.setUTCDate(base.getUTCDate() - 1);
      return berlinInstant(
        base.getUTCFullYear(), base.getUTCMonth() + 1, base.getUTCDate(),
        Number(relative[2]), Number(relative[3]),
      );
    }
    const date = plain.match(/\b(\d{2})\.(\d{2})\.(\d{4})\b/);
    return date ? berlinInstant(Number(date[3]), Number(date[2]), Number(date[1]), 12, 0) : null;
  };

  const items = [];
  for (const article of articles) {
    const id = (article.match(/data-adid=["'](\d+)["']/) || [])[1];
    const href =
      (article.match(/data-href=["'](\/s-anzeige\/[^"']+)["']/) || [])[1] ||
      (article.match(/href=["'](\/s-anzeige\/[^"']+)["']/) || [])[1];
    if (!id || !href) continue;

    let meta = {};
    const ld = article.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/i);
    if (ld) {
      try {
        meta = JSON.parse(ld[1]);
      } catch {
        meta = {};
      }
    }

    const plain = strip(article);

    // The price has its own bold line; the description above it often names
    // other amounts ("2.000 € investiert"), so it is read from there first.
    const priceBlock = article.match(/<p[^>]*font-strong[^>]*>\s*([^<]*?€[^<]*?)<\/p>/i);
    const priceText = priceBlock ? strip(priceBlock[1]) : (plain.match(/[\d.]+\s*€(?:\s*VB)?(?!.*€)/) || [""])[0];
    const price = num((priceText.match(/[\d.]+/) || [])[0]);
    if (!price || price < 100) continue;

    // Kilometres and first registration come as small tags under the price.
    const tags = [...article.matchAll(/<span[^>]*data-dhl-promotion[^>]*>([\s\S]*?)<\/span>/gi)].map((m) => strip(m[1]));
    const kmTag = tags.find((tag) => /^\d[\d.]*\s*km$/.test(tag));
    const ezTag = tags.find((tag) => /^EZ\s/.test(tag));
    const km = kmTag ? [null, kmTag] : plain.match(/(\d{1,3}(?:\.\d{3})+|\d{1,6})\s*km\b(?!\))/);
    const ez = (ezTag || plain).match(/EZ\s*(\d{2})\/(\d{4})/);
    const place = plain.match(/\b(\d{5})\s+([^()]+?)\s*\((?:ca\.\s*)?(\d+)\s*km\)/);
    const placeOnly = place ? null : plain.match(/\b(\d{5})\s+([A-ZÄÖÜ][^\d€]{1,40}?)\s+(?:Heute|Gestern|\d{2}\.\d{2}\.\d{4})/);
    const image =
      (meta.contentUrl && String(meta.contentUrl)) ||
      (article.match(/<img[^>]+src=["'](https:\/\/img\.kleinanzeigen\.de\/[^"']+)["']/i) || [])[1] ||
      null;
    const title = strip(meta.title) || strip((article.match(/<h2[^>]*>([\s\S]*?)<\/h2>/i) || [])[1]) || "Fahrzeug";
    const power = plain.match(/(\d{2,4})\s*PS\b/);

    items.push({
      key: `KLEINANZEIGEN:${id}`,
      source: "KLEINANZEIGEN",
      id,
      numericId: Number(id),
      url: `https://www.kleinanzeigen.de${href}`,
      title,
      make: null,
      model: null,
      price,
      priceNote: /VB/.test(priceText) ? "VB" : null,
      mileageKm: km ? num(km[1]) : null,
      firstRegistration: ez ? `${ez[1]}/${ez[2]}` : null,
      powerPs: power ? Number(power[1]) : null,
      fuel: (plain.match(/\b(Benzin|Diesel|Elektro|Hybrid|Autogas)\b/) || [])[1] || null,
      gearbox: (plain.match(/\b(Automatik|Schaltgetriebe|Manuell)\b/) || [])[1] || null,
      location: place ? `${place[1]} ${place[2].trim()}` : placeOnly ? `${placeOnly[1]} ${placeOnly[2].trim()}` : null,
      distanceKm: place ? Number(place[3]) : null,
      sellerType: "UNKNOWN",
      image,
      rating: null,
      postedAt: postedAt(plain),
      // Paid "TOP" slots sit above the newest ads and are usually old.
      promoted: /(^|\s)TOP(\s|$)/.test(plain.slice(0, 60)),
    });
  }

  return {
    ok: true,
    items,
    error: articles.length ? null : /captcha|zugriff verweigert|access denied/i.test(text)
      ? "Kleinanzeigen hat die Anfrage blockiert."
      : null,
  };
}

/* ============================================================ run a search */

async function fetchPage(url, label) {
  return request(url, { label, timeoutMs: 8_000, retries: 0 });
}

export async function searchAutoScout(f) {
  const url = autoscoutUrl(f);
  const response = await fetchPage(url, "AutoScout24 Neu");
  if (!response.ok) return { ok: false, items: [], error: response.error, url, blocked: response.blocked };
  return { ...parseAutoScoutPage(response.body), url };
}

export async function searchKleinanzeigen(f, onBatch = () => {}) {
  let placeId = null;
  if (f.zip) {
    placeId = await kaPlaceId(f.zip).catch(() => null);
    if (!placeId) {
      return { ok: false, items: [], error: `Postleitzahl ${f.zip} bei Kleinanzeigen nicht gefunden.`, url: null };
    }
  }
  const urls = kleinanzeigenUrls(f, placeId);
  // Publish each filter combination as soon as it finishes. A slow combination
  // must not hold back cars already returned by another one.
  const results = await Promise.all(urls.map(async (url) => {
    const response = await fetchPage(url, "Kleinanzeigen Neu");
    const parsed = response.ok ? parseKleinanzeigenPage(response.body) : null;
    onBatch({
      scope: url,
      ok: response.ok && !parsed?.error,
      items: parsed?.items || [],
    });
    return { ...response, parsed };
  }));

  const items = [];
  const errors = [];
  const seen = new Set();
  for (const response of results) {
    if (!response.ok) {
      errors.push(response.error);
      continue;
    }
    const parsed = response.parsed;
    if (parsed.error) errors.push(parsed.error);
    for (const item of parsed.items) {
      if (seen.has(item.key)) continue;
      seen.add(item.key);
      items.push(item);
    }
  }
  return {
    ok: items.length > 0 || errors.length === 0,
    items,
    error: errors.length ? [...new Set(errors)].join(" · ") : null,
    url: urls[0],
    blocked: results.some((response) => response.blocked),
  };
}

export async function searchMobile(f) {
  if (!mobileConfigured()) {
    return { ok: false, items: [], error: "mobile.de-Zugang nicht eingerichtet.", url: null, skipped: true };
  }
  return mobileSearchNewest(f);
}

export const SEARCHERS = {
  AUTOSCOUT24: searchAutoScout,
  KLEINANZEIGEN: searchKleinanzeigen,
  MOBILE_DE: searchMobile,
};

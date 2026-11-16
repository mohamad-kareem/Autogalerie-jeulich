/**
 * Marktanalyse – Portalseiten lesen.
 *
 * Reine Textarbeit auf dem HTML, das die Browser-Erweiterung liefert:
 * mobile.de (Trefferliste, Anzeige, Marke/Modell-Nummern) und die
 * AutoScout24-Trefferliste. Kleinanzeigen-Trefferlisten und die Anzeigen von
 * AutoScout24 / Kleinanzeigen lesen die vorhandenen Parser (lib/portals,
 * lib/neue-angebote/sources).
 *
 * Geprüft gegen die echten Seiten im November 2026.
 */

import { euroClass, fuelKey, gearKey, ratingLevel, regMonths, toInt } from "./text.js";

/* ------------------------------------------------------------ mobile.de */

/**
 * mobile.de liefert seine Daten als Next.js-"Flight"-Stücke:
 * <script>self.__next_f.push([1,"…"])</script>. Zusammengesetzt ergeben sie
 * einen Text, in dem die Daten als JSON stehen.
 */
export function mobileFlight(html) {
  const parts = [];
  const re = /<script[^>]*>\s*self\.__next_f\.push\(\[1,("(?:[^"\\]|\\[\s\S])*")\]\)\s*<\/script>/g;
  for (const match of String(html).matchAll(re)) {
    try {
      parts.push(JSON.parse(match[1]));
    } catch {
      /* ein unvollständiges Stück überspringen */
    }
  }
  return parts.join("");
}

/** Das JSON-Objekt oder -Array, das an `start` beginnt. */
function jsonAt(text, start) {
  const open = text[start];
  const close = open === "{" ? "}" : open === "[" ? "]" : null;
  if (!close) return null;
  let depth = 0;
  let inString = false;
  let escaped = false;
  for (let i = start; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      if (escaped) escaped = false;
      else if (c === "\\") escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') inString = true;
    else if (c === "{" || c === "[") depth++;
    else if (c === "}" || c === "]") {
      depth--;
      if (depth === 0) {
        try {
          return JSON.parse(text.slice(start, i + 1));
        } catch {
          return null;
        }
      }
    }
  }
  return null;
}

/** Das erste JSON hinter `marker`, das `accept` besteht – derselbe Schlüssel kommt mehrfach vor. */
function jsonAfter(text, marker, accept = () => true) {
  let at = -1;
  for (let tries = 0; tries < 40; tries++) {
    at = text.indexOf(marker, at + 1);
    if (at < 0) return null;
    const value = jsonAt(text, at + marker.length);
    if (value && accept(value)) return value;
  }
  return null;
}

const psOf = (text) => toInt(String(text || "").match(/\((\d{2,4})\s*PS\)/)?.[1]) ?? null;

/** mobile.de-Trefferliste → Vergleichsfahrzeuge. */
export function parseMobileSearch(html) {
  const flight = mobileFlight(html);
  if (!flight) return { ok: false, items: [], error: "mobile.de: Seitendaten nicht gefunden." };
  const results = jsonAfter(flight, '"searchResults":', (value) => Array.isArray(value.listings));
  if (!results || !Array.isArray(results.listings)) {
    const blocked = /captcha|zugriff verweigert|access denied|ungew(?:ö|oe)hnliche aktivit/i.test(html);
    return { ok: false, items: [], blocked, error: blocked ? "mobile.de verlangt eine Sicherheitsprüfung." : "mobile.de: keine Trefferliste gefunden." };
  }

  // Überschrift und alter Preis stehen nicht in der Datenliste, sondern bei den Karten.
  const titles = new Map();
  const oldPrices = new Map();
  const cards = [...flight.matchAll(/"listingId":(\d+)/g)];
  cards.forEach((card, index) => {
    const id = card[1];
    const part = flight.slice(card.index, Math.min(cards[index + 1]?.index ?? flight.length, card.index + 12000));
    if (!titles.has(id)) {
      const title = part.match(/"title":"((?:[^"\\]|\\.)*)"/);
      if (title) {
        try {
          titles.set(id, JSON.parse(`"${title[1]}"`));
        } catch {
          titles.set(id, title[1]);
        }
      }
    }
    if (!oldPrices.has(id)) {
      const old = toInt(part.match(/"strike-through-price","children":"([^"]{1,20})"/)?.[1]);
      if (old) oldPrices.set(id, old);
    }
  });

  const items = [];
  const seen = new Set();
  for (const entry of results.listings) {
    const id = entry?.id != null ? String(entry.id) : null;
    const attr = entry?.attr || {};
    const price = entry?.price?.grs?.amount;
    if (!id || seen.has(id) || !Number.isFinite(price)) continue;
    if (attr.cn && attr.cn !== "DE") continue;
    seen.add(id);
    const make = entry.make?.localized || null;
    const model = entry.model?.localized || null;
    items.push({
      key: `MOBILE_DE:${id}`,
      source: "MOBILE_DE",
      id,
      url: `https://suchen.mobile.de/fahrzeuge/details.html?id=${id}`,
      title: titles.get(id) || [make, model].filter(Boolean).join(" ") || "Fahrzeug",
      make,
      model,
      price: Math.round(price),
      mileageKm: toInt(attr.ml),
      firstRegistration: attr.fr || null,
      regMonths: regMonths(attr.fr),
      powerPs: psOf(attr.pw),
      ccm: toInt(attr.cc),
      fuel: fuelKey(attr.ft),
      gearbox: gearKey(attr.tr),
      body: entry.category || attr.c || null,
      owners: toInt(attr.pvo),
      sellerType: entry.contact?.enumType === "DEALER" ? "DEALER" : /FSBO/.test(entry.contact?.enumType || "") ? "PRIVATE" : "UNKNOWN",
      location: [attr.z, attr.loc].filter(Boolean).join(" ") || null,
      zip: attr.z || null,
      emission: euroClass(attr.emc),
      rating: ratingLevel(entry.priceRating?.rating),
      oldPrice: oldPrices.get(id) > price ? oldPrices.get(id) : null,
    });
  }
  return { ok: true, items, total: Number.isFinite(results.numResultsTotal) ? results.numResultsTotal : null, error: null };
}

/** mobile.de-Nummern für Marke und Modell aus einer /auto/<marke>-<modell>.html-Seite. */
export function parseMobileMs(html) {
  const flight = mobileFlight(html);
  const params = jsonAfter(flight, '"filterParams":', (value) => typeof value.ms === "string");
  const ms = typeof params?.ms === "string" ? params.ms : null;
  if (!ms || !/^\d+;/.test(ms)) return { ok: false, ms: null, makeId: null, modelId: null };
  const [makeId, modelId] = ms.split(";");
  return { ok: true, ms, makeId: makeId || null, modelId: modelId || null };
}

/** Ein Textstück, auf das die Daten nur verweisen ("$75" → Zeile 75:T<länge>,<text>). */
function flightText(flight, reference) {
  const id = String(reference || "").match(/^\$([0-9a-f]+)$/i)?.[1];
  if (!id) return typeof reference === "string" ? reference : "";
  const match = flight.match(new RegExp(`(?:^|\\n)${id}:T([0-9a-f]+),`));
  if (!match) return "";
  const start = match.index + match[0].length;
  const bytes = parseInt(match[1], 16);
  // Die Länge zählt Bytes (UTF-8), nicht Zeichen.
  const encoded = new TextEncoder().encode(flight.slice(start, start + bytes));
  return new TextDecoder().decode(encoded.slice(0, bytes));
}

const stripHtml = (value) =>
  String(value || "")
    .replace(/<br\s*\/?>/gi, "\n").replace(/<\/(p|li|div|h\d)>/gi, "\n").replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;|&#x27;/g, "'").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/[ \t]+/g, " ").replace(/\n\s*\n+/g, "\n").trim();

/** mobile.de-Anzeige → Rohdaten des Fahrzeugs (subject.js bringt sie in Form). */
export function parseMobileListing(html, url = "") {
  const flight = mobileFlight(html);
  const at = flight.indexOf('"listing":{"attributes"');
  const listing = at < 0 ? null : jsonAt(flight, at + '"listing":'.length);
  if (!listing) return null;
  const attribute = (tag) => listing.attributes?.find((entry) => entry?.tag === tag)?.value ?? null;
  const condition = String(attribute("damageCondition") || "");
  const hu = String(attribute("hu") || "");
  return {
    source: "MOBILE_DE",
    id: listing.id != null ? String(listing.id) : null,
    url: listing.url || url,
    title: listing.title || [listing.shortTitle, listing.subTitle].filter(Boolean).join(" "),
    make: listing.make?.localized || listing.makeKey || null,
    model: listing.model?.localized || listing.modelKey || null,
    variant: listing.subTitle || null,
    price: listing.price?.grs?.amount ?? null,
    negotiable: listing.price?.type && listing.price.type !== "FIXED",
    firstRegistration: attribute("firstRegistration"),
    mileageKm: toInt(attribute("mileage")),
    powerPs: psOf(attribute("power")),
    ccm: toInt(attribute("cubicCapacity")),
    fuel: attribute("fuel"),
    gearbox: attribute("transmission"),
    body: attribute("category") || listing.category || null,
    color: attribute("color"),
    owners: toInt(attribute("numberOfPreviousOwners")),
    tuv: /neu/i.test(hu) ? "neu" : hu || null,
    accident: listing.isDamageCase || /besch(?:ä|ae)digt|unfallfahrzeug/i.test(condition) ? "DAMAGED"
      : /unfallfrei/i.test(condition) ? "NONE" : /repariert/i.test(condition) ? "REPAIRED" : "UNKNOWN",
    conditionText: condition,
    countryVersion: attribute("countryVersion"),
    sellerType: listing.contact?.enumType === "DEALER" ? "DEALER" : /FSBO/.test(listing.contact?.enumType || "") ? "PRIVATE" : "UNKNOWN",
    sellerName: listing.contact?.name || null,
    location: String(listing.contact?.address2 || "").replace(/^[A-Z]{1,3}-/, "") || null,
    listedAt: Number.isFinite(listing.created) ? new Date(listing.created * 1000).toISOString() : null,
    equipment: Array.isArray(listing.features) ? listing.features.filter((f) => typeof f === "string") : [],
    description: stripHtml(flightText(flight, listing.htmlDescription)),
    image: listing.images?.[0]?.uri ? `https://${String(listing.images[0].uri).replace(/^https?:\/\//, "")}?rule=mo-640` : null,
    mobile: { makeId: listing.makeId ?? null, modelId: listing.modelId ?? null },
    rating: ratingLevel(listing.priceRating?.rating || listing.priceRating?.ratingLabel),
    emission: euroClass(attribute("emissionClass")),
    oldPrice: listing.stPrice?.grs?.amount > listing.price?.grs?.amount ? Math.round(listing.stPrice.grs.amount) : null,
  };
}

/* ------------------------------------------------------------ AutoScout24 */

export function parseAutoScoutSearch(html) {
  const match = String(html).match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>([\s\S]*?)<\/script>/i);
  if (!match) {
    const blocked = /captcha|access denied|zugriff verweigert/i.test(html);
    return { ok: false, items: [], blocked, error: blocked ? "AutoScout24 verlangt eine Sicherheitsprüfung." : "AutoScout24: Seitendaten nicht gefunden." };
  }
  let page;
  try {
    page = JSON.parse(match[1])?.props?.pageProps;
  } catch {
    return { ok: false, items: [], error: "AutoScout24: Seitendaten nicht lesbar." };
  }
  if (!Array.isArray(page?.listings)) return { ok: false, items: [], error: "AutoScout24: keine Trefferliste gefunden." };

  const items = [];
  const seen = new Set();
  for (const entry of page.listings) {
    if (!entry?.id || !entry?.url || seen.has(entry.id)) continue;
    if (entry.location?.countryCode && entry.location.countryCode !== "DE") continue;
    // Empfehlungen mit gelockerten Filtern sind keine Treffer dieser Suche.
    if (/recommend|relax|similar|related/i.test(entry.searchResultSection || "")) continue;
    seen.add(entry.id);
    const vehicle = entry.vehicle || {};
    const detail = (name) => (entry.vehicleDetails || []).find((d) => d?.ariaLabel === name)?.data || null;
    const price = entry.price?.priceRaw ?? toInt(entry.tracking?.price);
    if (!Number.isFinite(price)) continue;
    const registration = String(entry.tracking?.firstRegistration || detail("Erstzulassung") || "").replace("-", "/");
    items.push({
      key: `AUTOSCOUT24:${entry.id}`,
      source: "AUTOSCOUT24",
      id: String(entry.id),
      url: new URL(entry.url, "https://www.autoscout24.de").toString(),
      title: [vehicle.make, vehicle.model, vehicle.modelVersionInput].filter(Boolean).join(" ").replace(/\s+/g, " ").trim() || "Fahrzeug",
      make: vehicle.make || null,
      model: vehicle.model || null,
      price: Math.round(price),
      mileageKm: toInt(entry.tracking?.mileage) ?? toInt(vehicle.mileageInKm),
      firstRegistration: registration || null,
      regMonths: regMonths(registration),
      powerPs: psOf(detail("Leistung")),
      ccm: toInt(vehicle.engineDisplacementInCCM),
      fuel: fuelKey(vehicle.fuel || detail("Kraftstoff")),
      gearbox: gearKey(vehicle.transmission || detail("Getriebe")),
      body: vehicle.variant || null,
      owners: null,
      sellerType: /private/i.test(entry.seller?.type || "") ? "PRIVATE" : entry.seller?.type ? "DEALER" : "UNKNOWN",
      location: [entry.location?.zip, entry.location?.city].filter(Boolean).join(" ") || null,
      zip: entry.location?.zip || null,
      damaged: vehicle.isCurrentlyDamaged === true,
      // AutoScout24 führt bei jedem Treffer die Generation seines Fahrzeugkatalogs.
      as24Gen: toInt(String(entry.tracking?.modelTaxonomy || "").match(/generation_id:(\d+)/)?.[1]),
      rating: ratingLevel(entry.tracking?.priceLabel),
      oldPrice: toInt(entry.superDeal?.oldPriceFormatted) > price ? toInt(entry.superDeal.oldPriceFormatted) : null,
    });
  }
  return { ok: true, items, total: Number.isFinite(page.numberOfResults) ? page.numberOfResults : null, error: null };
}

/* ------------------------------------------------------------ verschlanken */

/**
 * Kürzt eine Seite vor dem Hochladen auf das, was die Parser brauchen.
 * Läuft im Browser der App; ändert nichts am Inhalt der Daten.
 */
export function slimPage(portal, kind, html) {
  const text = String(html || "");
  if (portal === "MOBILE_DE") {
    const scripts = text.match(/<script[^>]*>\s*self\.__next_f\.push\(\[1,"(?:[^"\\]|\\[\s\S])*"\]\)\s*<\/script>/g) || [];
    const ld = text.match(/<script[^>]*application\/ld\+json[^>]*>[\s\S]*?<\/script>/gi) || [];
    const title = text.match(/<title[^>]*>[\s\S]*?<\/title>/i)?.[0] || "";
    if (scripts.length) return `<html><head>${title}</head><body>${ld.join("")}${scripts.join("")}</body></html>`;
  }
  if (portal === "AUTOSCOUT24" && kind === "search") {
    const data = text.match(/<script[^>]+id=["']__NEXT_DATA__["'][^>]*>[\s\S]*?<\/script>/i)?.[0];
    if (data) return `<html><body>${data}</body></html>`;
  }
  return text;
}

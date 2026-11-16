/**
 * Kleinanzeigen — reads one ad page (mostly private sellers).
 */

import { request } from "./http";
import {
  jsonLdOfType,
  metaContent,
  textContent,
  detailPairs,
  detailValue,
} from "./html";
import { cleanText, containsModelName, normalizeText, toNumber } from "./utils";
import {
  createVehicle,
  detectTuv,
  detectServiceHistory,
  detectConditionFromText,
} from "./vehicle";

/** The ad number from /s-anzeige/vw-golf/2912345678-216-2189. */
function listingId(rawUrl) {
  try {
    return new URL(String(rawUrl).trim()).pathname.match(/\/s-anzeige\/[^/]+\/(\d{6,})/i)?.[1] || null;
  } catch {
    return null;
  }
}

function sellerTypeFromText(text) {
  if (/privater\s+nutzer|privatanbieter/i.test(text)) return "PRIVATE";
  if (/gewerblicher\s+nutzer|h[äa]ndler/i.test(text)) return "DEALER";
  return "PRIVATE";
}

/**
 * Reconciles the "Modell" dropdown with the headline the seller wrote.
 *
 * A private ad for a Renault Modus had "Clio" selected in the dropdown, and the
 * ad was then read as a Clio. The headline is deliberate, the
 * dropdown is a careless click, so when the dropdown value does not appear in
 * the title we take the word after the make instead.
 */
function modelFromTitle(title, expectedModel, make) {
  if (containsModelName(title, expectedModel)) return expectedModel;

  const brand = normalizeText(make);
  if (!brand) return null;
  const headline = ` ${normalizeText(title)} `;
  const brandPosition = headline.indexOf(` ${brand} `);
  if (brandPosition === -1) return null;

  const afterMake = headline.slice(brandPosition + brand.length + 2);
  const model = /^(?:[a-z]{1,2} \d+[a-z]?|[a-z][a-z\d]{1,17}|\d{1,4}[a-z]?)(?= )/.exec(afterMake)?.[0];
  return model || null;
}

/** The "Ausstattung" tags: <ul class="checktaglist"><li class="checktag">Sitzheizung</li>… */
function checktags(html) {
  const tags = [];
  const pattern = /<li[^>]*class=["'][^"']*\bchecktag\b[^"']*["'][^>]*>([\s\S]{0,120}?)<\/li>/gi;
  let hit;
  while ((hit = pattern.exec(html)) !== null) {
    const label = cleanText(textContent(hit[1]));
    if (label) tags.push(label);
  }
  // New layout (2026): <div id="viewad-configuration"><ul><li><span>Sitzheizung</span></li>…
  if (!tags.length) {
    const block = (html.match(/id=["']viewad-configuration["'][^>]*>([\s\S]{0,20000}?)<\/ul>/i) || [])[1] || "";
    const item = /<li[^>]*>([\s\S]{0,300}?)<\/li>/gi;
    while ((hit = item.exec(block)) !== null) {
      const label = cleanText(textContent(hit[1]));
      if (label) tags.push(label);
    }
  }
  return [...new Set(tags)];
}

/**
 * The ad's photo gallery. Only images inside gallery elements are taken —
 * the page also shows photos of the seller's other ads further down.
 */
function galleryImages(html) {
  const images = [];
  // "?rule=$_59.AUTO" is the large rendition; normalise every entry to it.
  const add = (src) => images.push(src.replace(/&amp;/g, "&").replace(/\?rule=.*$/, "") + "?rule=$_59.AUTO");
  const pattern =
    /galleryimage-element[^>]*>\s*<img[^>]+?(?:data-imgsrc|src)=["'](https:\/\/img\.kleinanzeigen\.de\/[^"']+)["']/gi;
  let hit;
  while ((hit = pattern.exec(html)) !== null) add(hit[1]);

  // New layout (2026): main photo <img id="viewad-image" src="…">; the ad's other photos
  // come before the title, photos of similar ads further down are left out.
  if (!images.length) {
    const main = (html.match(/<img\b[^>]*\bid=["']viewad-image["'][^>]*>/i) || [])[0];
    const mainSrc = main && (main.match(/\bsrc=["'](https:\/\/img\.kleinanzeigen\.de\/api\/v1\/prod-ads\/images\/[^"']+)["']/i) || [])[1];
    if (mainSrc) {
      add(mainSrc);
      const end = html.search(/id=["']viewad-title["']/i);
      const head = end > 0 ? html.slice(0, end) : "";
      const img = /<img\b[^>]*\bsrc=["'](https:\/\/img\.kleinanzeigen\.de\/api\/v1\/prod-ads\/images\/[^"']+)["']/gi;
      while ((hit = img.exec(head)) !== null) add(hit[1]);
    }
  }
  return [...new Set(images)];
}

/** "22.09.2026" from the ad's info line, i.e. when it went online. */
function postedDate(html) {
  const block = (html.match(/id=["']viewad-extra-info["'][\s\S]{0,400}/i) || [])[0] || "";
  return (block.match(/(\d{2}\.\d{2}\.\d{4})/) || [])[1] || null;
}

/* ------------------------------------------------------------ fair use
 * Kleinanzeigen blocks an IP range when it sees too many automated requests
 * ("IP-Bereich vorübergehend gesperrt") — and then the dealer cannot use the
 * site at all. So: no retries, few requests, and after a block no request at
 * all for 24 hours. The block is never worked around.
 */
const PAUSE_MS = 24 * 60 * 60 * 1000;
let pausedUntil = 0;

function isPaused() {
  return Date.now() < pausedUntil;
}

function pausedResult() {
  const until = new Date(pausedUntil).toLocaleString("de-DE", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" });
  return {
    ok: false,
    vehicle: null,
    error: `Kleinanzeigen hat den Zugang gesperrt – Abfragen pausiert bis ${until}.`,
    blocked: true,
  };
}

/** One request to Kleinanzeigen; a block pauses all further requests. */
async function ask(url, label) {
  if (isPaused()) return { ok: false, blocked: true, error: pausedResult().error, body: "" };
  const response = await request(url, { label, retries: 0 });
  const body = String(response.body || "").slice(0, 6_000);
  if (response.blocked || /IP-Bereich[^<]{0,40}gesperrt|ip-eingeschraenkt/i.test(body)) {
    pausedUntil = Date.now() + PAUSE_MS;
    return { ...response, ok: false, blocked: true, error: pausedResult().error };
  }
  return response;
}

export async function fetchListing(url) {
  const response = await ask(url, "Kleinanzeigen");

  if (!response.ok) {
    return {
      ok: false,
      vehicle: null,
      error: response.error,
      blocked: response.blocked,
    };
  }

  return parseListingPage(response.body, url);
}

/** Reads one Kleinanzeigen ad page. Separate from the request, for tests. */
export function parseListingPage(html, url) {
  const text = textContent(html).slice(0, 30_000);
  const pairs = detailPairs(html);
  const ld = jsonLdOfType(html, ["Car", "Vehicle", "Product", "Offer"]) || {};
  const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;

  const priceBlock =
    (html.match(/id=["']viewad-price["'][^>]*>([\s\S]{0,120}?)</i) || [])[1] ||
    "";
  const priceText = cleanText(textContent(priceBlock));

  const title =
    cleanText((html.match(/id=["']viewad-title["'][^>]*>([\s\S]{0,300}?)</i) || [])[1]) ||
    cleanText(ld.name) ||
    metaContent(html, ["og:title"]);

  const description =
    cleanText(
      textContent(
        (html.match(
          /id=["']viewad-description-text["'][^>]*>([\s\S]{0,12000}?)<\/(?:p|div)>/i,
        ) || [])[1] || "",
      ),
    ) ||
    cleanText(ld.description) ||
    metaContent(html, ["og:description"]);

  const combined = `${title || ""} ${description || ""} ${text}`;
  const make = detailValue(pairs, ["marke"]) || cleanText(ld.brand?.name || ld.brand);
  const dropdownModel = detailValue(pairs, ["modell"]);

  const vehicle = createVehicle({
    source: "KLEINANZEIGEN",
    sourceLevel: "PRIVATE",
    listingId: listingId(url),
    listingUrl: url,
    title,
    make,
    // The seller picks "Modell" from a dropdown and often picks wrong; the
    // title is what he actually typed. Where they disagree, the title wins.
    model: modelFromTitle(title, dropdownModel, make) || dropdownModel,
    variant: null,
    price:
      toNumber(priceText) ??
      toNumber(offer?.price) ??
      toNumber(metaContent(html, ["product:price:amount"])),
    // Private sales carry no deductible VAT — the dealer buys under §25a.
    priceType: "MARGIN_TAXED",
    negotiable: /\bVB\b|verhandlungsbasis/i.test(priceText),
    firstRegistration: detailValue(pairs, ["erstzulassung"]),
    mileageKm: toNumber(detailValue(pairs, ["kilometerstand"])),
    fuel: detailValue(pairs, ["kraftstoffart", "kraftstoff"]),
    gearbox: detailValue(pairs, ["getriebe"]),
    powerPs: toNumber(detailValue(pairs, ["leistung"])),
    bodyType: detailValue(pairs, ["fahrzeugtyp"]),
    doors: toNumber(detailValue(pairs, ["anzahl türen", "türen"])),
    color: detailValue(pairs, ["außenfarbe", "aussenfarbe"]),
    tuvUntil: detailValue(pairs, ["hu bis", "tüv"]) || detectTuv(combined),
    serviceHistory: detectServiceHistory(combined),
    condition:
      detectConditionFromText(
        `${detailValue(pairs, ["fahrzeugzustand"]) || ""} ${combined}`,
      ),
    sellerType: sellerTypeFromText(text),
    location:
      cleanText(
        (html.match(/id=["']viewad-locality["'][^>]*>([\s\S]{0,120}?)</i) || [])[1],
      ) || null,
    // og:image is only the Kleinanzeigen logo on the new pages – never take that as the car photo.
    images: [...galleryImages(html), metaContent(html, ["og:image"])]
      .filter((src) => src && !/\/static\/img\/common\/logo\//i.test(src)),
    equipment: checktags(html),
    upholstery: detailValue(pairs, ["material innenausstattung", "innenausstattung"]),
    listedAt: postedDate(html),
    description,
    extractedFrom: "html",
  });

  if (!vehicle.price && !vehicle.title) {
    return {
      ok: false,
      vehicle: null,
      error: "Die Kleinanzeigen-Anzeige konnte nicht gelesen werden.",
      blocked: false,
    };
  }

  return { ok: true, vehicle, error: null, blocked: false };
}

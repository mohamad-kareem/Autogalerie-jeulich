/**
 * Kleinanzeigen — the private-seller side of the market.
 *
 * For a dealer these ads are the *buying* level rather than retail, so they
 * are tagged PRIVATE and lifted to retail level before they influence the
 * market value. Target extraction is always supported; comparable search is
 * best effort and never fatal.
 */

import { POLICY } from "../config";
import { request } from "../http";
import {
  jsonLdOfType,
  metaContent,
  textContent,
  detailPairs,
  detailValue,
} from "../html";
import { cleanText, normalizeText, toNumber, unique, slugify } from "../utils";
import {
  createVehicle,
  detectTuv,
  detectServiceHistory,
  detectConditionFromText,
} from "../vehicle";
import { listingId } from "./urls";

const BASE = "https://www.kleinanzeigen.de";

/** Car category id on Kleinanzeigen. */
const CAR_CATEGORY = "c216";

function sellerTypeFromText(text) {
  if (/privater\s+nutzer|privatanbieter/i.test(text)) return "PRIVATE";
  if (/gewerblicher\s+nutzer|h[äa]ndler/i.test(text)) return "DEALER";
  return "PRIVATE";
}

/**
 * Reconciles the "Modell" dropdown with the headline the seller wrote.
 *
 * A private ad for a Renault Modus had "Clio" selected in the dropdown, and the
 * whole analysis was then run against Clios. The headline is deliberate, the
 * dropdown is a careless click, so when the dropdown value does not appear in
 * the title we take the word after the make instead.
 */
function modelFromTitle(title, dropdownModel) {
  const headline = cleanText(title);
  const chosen = cleanText(dropdownModel);

  if (!headline) return chosen || null;
  if (chosen && normalizeText(headline).includes(normalizeText(chosen))) {
    return chosen;
  }

  // Second word of "Renault Modus 1.6 Benziner" — the model.
  const words = headline.split(/\s+/).filter(Boolean);
  const candidate = words[1];

  // Only override when the title really offers a model-looking word.
  if (candidate && /^[A-Za-zÄÖÜäöü][\wÄÖÜäöüß.-]{1,18}$/.test(candidate)) {
    return candidate;
  }

  return chosen || null;
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
  return tags;
}

/**
 * The ad's photo gallery. Only images inside gallery elements are taken —
 * the page also shows photos of the seller's other ads further down.
 */
function galleryImages(html) {
  const images = [];
  const pattern =
    /galleryimage-element[^>]*>\s*<img[^>]+?(?:data-imgsrc|src)=["'](https:\/\/img\.kleinanzeigen\.de\/[^"']+)["']/gi;
  let hit;
  while ((hit = pattern.exec(html)) !== null) {
    // "?rule=$_59.AUTO" is the large rendition; normalise every entry to it.
    images.push(hit[1].replace(/\?rule=.*$/, "") + "?rule=$_59.AUTO");
  }
  return [...new Set(images)];
}

/** "22.09.2026" from the ad's info line, i.e. when it went online. */
function postedDate(html) {
  const block = (html.match(/id=["']viewad-extra-info["'][\s\S]{0,400}/i) || [])[0] || "";
  return (block.match(/(\d{2}\.\d{2}\.\d{4})/) || [])[1] || null;
}

export async function fetchListing(url) {
  const response = await request(url, { label: "Kleinanzeigen" });

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
          /id=["']viewad-description-text["'][^>]*>([\s\S]{0,8000}?)<\/p>/i,
        ) || [])[1] || "",
      ),
    ) ||
    cleanText(ld.description) ||
    metaContent(html, ["og:description"]);

  const combined = `${title || ""} ${description || ""} ${text}`;

  const vehicle = createVehicle({
    source: "KLEINANZEIGEN",
    sourceLevel: "PRIVATE",
    listingId: listingId(url),
    listingUrl: url,
    title,
    make: detailValue(pairs, ["marke"]) || cleanText(ld.brand?.name || ld.brand),
    // The seller picks "Modell" from a dropdown and often picks wrong; the
    // title is what he actually typed. Where they disagree, the title wins.
    model: modelFromTitle(title, detailValue(pairs, ["modell"])),
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
    images: [...galleryImages(html), metaContent(html, ["og:image"])].filter(Boolean),
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

/* ------------------------------------------------------------------ search */

function parseSearchPage(html) {
  const results = [];
  const articles = html.match(/<article[\s\S]{0,8000}?<\/article>/gi) || [];

  for (const article of articles) {
    const idMatch = article.match(/data-adid=["'](\d+)["']/i);
    const hrefMatch = article.match(/href=["'](\/s-anzeige\/[^"']+)["']/i);
    if (!idMatch || !hrefMatch) continue;

    const text = textContent(article);
    const price = toNumber((text.match(/(\d[\d.\s]{2,})\s*€/) || [])[1]);
    if (!price || price < 300) continue;

    const title = cleanText(
      (article.match(/<a[^>]*class=["'][^"']*ellipsis[^"']*["'][^>]*>([\s\S]{0,200}?)<\/a>/i) ||
        [])[1],
    );

    results.push({
      listingId: idMatch[1],
      listingUrl: `${BASE}${hrefMatch[1]}`,
      title,
      price,
      mileageKm: toNumber((text.match(/(\d[\d.\s]{2,})\s*km\b/) || [])[1]),
      firstRegistration:
        (text.match(/\b(0?[1-9]|1[0-2])\/((?:19|20)\d{2})\b/) || [])[0] ||
        (text.match(/\bEZ\s*((?:19|20)\d{2})\b/i) || [])[1],
      fuel: (text.match(/\b(Benzin|Diesel|Elektro|Hybrid|Autogas|Erdgas)\b/i) || [])[1],
      gearbox: (text.match(/\b(Automatik|Schaltgetriebe|Halbautomatik)\b/i) || [])[1],
      powerPs: toNumber((text.match(/(\d{2,4})\s*PS\b/) || [])[1]),
      images: [
        (article.match(/<img[^>]+?(?:src|data-imgsrc)=["'](https:\/\/img\.kleinanzeigen\.de\/[^"']+)["']/i) ||
          [])[1],
      ].filter(Boolean),
    });
  }

  return results;
}

export async function searchComparables(target, { limit = POLICY.perSourceLimit } = {}) {
  if (!target.make) {
    return { ok: false, vehicles: [], error: "Keine Marke bekannt.", blocked: false };
  }

  const query = slugify([target.make, target.model].filter(Boolean).join(" "));
  const errors = [];
  const collected = [];
  let blocked = false;

  const urls = [
    `${BASE}/s-autos/anzeige:angebote/${query}/k0${CAR_CATEGORY}`,
    `${BASE}/s-autos/anzeige:angebote/seite:2/${query}/k0${CAR_CATEGORY}`,
  ];

  await Promise.all(
    urls.map(async (url) => {
      const response = await request(url, { label: "Kleinanzeigen Suche" });
      if (!response.ok) {
        errors.push(response.error);
        blocked = blocked || response.blocked;
        return;
      }
      collected.push(...parseSearchPage(response.body));
    }),
  );

  const vehicles = [];
  const seen = new Set();

  for (const raw of collected) {
    if (seen.has(raw.listingId)) continue;
    seen.add(raw.listingId);

    const vehicle = createVehicle({
      ...raw,
      source: "KLEINANZEIGEN",
      sourceLevel: "PRIVATE",
      sellerType: "PRIVATE",
      priceType: "MARGIN_TAXED",
      make: target.make,
      model: target.model,
      extractedFrom: "search",
    });

    if (vehicle.price) vehicles.push(vehicle);
    if (vehicles.length >= limit) break;
  }

  return {
    ok: vehicles.length > 0,
    vehicles,
    error: vehicles.length ? null : unique(errors).join(" · ") || "Keine Treffer.",
    blocked,
  };
}

export function canHandle(url) {
  return /kleinanzeigen\./i.test(String(url));
}

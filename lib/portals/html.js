/**
 * Dependency-free HTML helpers.
 *
 * Marketplaces change their markup regularly, so extraction is layered:
 * embedded JSON first (stable, machine readable), JSON-LD second, visible
 * text last. Nothing here assumes a specific DOM path.
 */

import { cleanText, safeJsonParse, toNumber } from "./utils";

/** Strips tags and collapses whitespace. */
export function textContent(html) {
  return cleanText(
    String(html ?? "")
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " "),
  );
}

/** Read one km figure without joining adjacent fields such as the year. */
export function mileageFromText(text) {
  const match = /(?<![\d.,-])(\d{1,3}(?:\.\d{3})+|\d{1,3}(?:[ \u00a0\u202f]\d{3})+|\d{1,7})\s*km\b/i.exec(text || "");
  return toNumber(match?.[1]);
}

/** Contents of a script tag with the given id, parsed as JSON. */
export function scriptJsonById(html, id) {
  const pattern = new RegExp(
    `<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)</script>`,
    "i",
  );
  const match = String(html ?? "").match(pattern);
  return match ? safeJsonParse(match[1].trim()) : null;
}

/** Every application/ld+json block on the page, parsed and flattened. */
export function jsonLdBlocks(html) {
  const blocks = [];
  const pattern =
    /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let match;

  while ((match = pattern.exec(String(html ?? ""))) !== null) {
    const parsed = safeJsonParse(match[1].trim());
    if (!parsed) continue;
    const items = Array.isArray(parsed) ? parsed : [parsed];
    for (const item of items) {
      if (!item || typeof item !== "object") continue;
      blocks.push(item);
      if (Array.isArray(item["@graph"])) blocks.push(...item["@graph"]);
    }
  }

  return blocks;
}

/** First JSON-LD block whose @type matches one of `types`. */
export function jsonLdOfType(html, types) {
  const wanted = types.map((type) => type.toLowerCase());
  return (
    jsonLdBlocks(html).find((block) => {
      const type = block["@type"];
      const list = Array.isArray(type) ? type : [type];
      return list.some(
        (entry) => entry && wanted.includes(String(entry).toLowerCase()),
      );
    }) || null
  );
}

/** Content of the first matching meta tag. */
export function metaContent(html, names) {
  const source = String(html ?? "");

  for (const name of names) {
    const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    const patterns = [
      new RegExp(
        `<meta[^>]*(?:property|name|itemprop)=["']${escaped}["'][^>]*content=["']([^"']*)["']`,
        "i",
      ),
      new RegExp(
        `<meta[^>]*content=["']([^"']*)["'][^>]*(?:property|name|itemprop)=["']${escaped}["']`,
        "i",
      ),
    ];
    for (const pattern of patterns) {
      const match = source.match(pattern);
      if (match) return cleanText(match[1]);
    }
  }

  return null;
}

/**
 * Kleinanzeigen-style definition lists:
 *   <li class="addetailslist--detail">Kilometerstand
 *      <span class="addetailslist--detail--value">120.000 km</span></li>
 * Returns a lowercase-keyed map of label -> value.
 */
export function detailPairs(html) {
  const pairs = {};
  const source = String(html ?? "");

  const listPattern =
    /<li[^>]*class=["'][^"']*addetailslist--detail[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
  let match;
  while ((match = listPattern.exec(source)) !== null) {
    const block = match[1];
    const valueMatch = block.match(
      /<span[^>]*addetailslist--detail--value[^>]*>([\s\S]*?)<\/span>/i,
    );
    if (!valueMatch) continue;
    const label = textContent(block.replace(valueMatch[0], "")).toLowerCase();
    const value = textContent(valueMatch[1]);
    if (label && value) pairs[label] = value;
  }

  // Generic <dt>/<dd> pairs, used by several detail pages.
  const dlPattern = /<dt[^>]*>([\s\S]*?)<\/dt>\s*<dd[^>]*>([\s\S]*?)<\/dd>/gi;
  while ((match = dlPattern.exec(source)) !== null) {
    const label = textContent(match[1]).toLowerCase();
    const value = textContent(match[2]);
    if (label && value && !pairs[label]) pairs[label] = value;
  }

  return pairs;
}

/** Looks up a detail map by any of several German labels. */
export function detailValue(pairs, labels) {
  for (const label of labels) {
    const needle = label.toLowerCase();
    for (const [key, value] of Object.entries(pairs)) {
      if (key.includes(needle)) return value;
    }
  }
  return null;
}

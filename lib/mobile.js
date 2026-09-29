/**
 * mobile.de Seller API — the ads of our own dealer account.
 * Docs: https://services.mobile.de/manual/seller-api.html
 *
 * Credentials come from the environment and are never logged.
 */

const TIMEOUT_MS = 25_000;

export const fetchMobileCars = async () => {
  const { MOBILEDE_USERNAME, MOBILEDE_PASSWORD, MOBILEDE_SELLER_ID } = process.env;
  if (!MOBILEDE_USERNAME || !MOBILEDE_PASSWORD || !MOBILEDE_SELLER_ID) {
    throw new Error("mobile.de: Zugangsdaten fehlen (MOBILEDE_USERNAME / MOBILEDE_PASSWORD / MOBILEDE_SELLER_ID).");
  }

  const auth = Buffer.from(`${MOBILEDE_USERNAME}:${MOBILEDE_PASSWORD}`).toString("base64");
  const url = `https://services.mobile.de/seller-api/sellers/${encodeURIComponent(MOBILEDE_SELLER_ID)}/ads`;

  const res = await fetch(url, {
    method: "GET",
    headers: {
      Accept: "application/vnd.de.mobile.api+json",
      Authorization: `Basic ${auth}`,
    },
    cache: "no-store",
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`mobile.de antwortet mit ${res.status} ${res.statusText}`);
  }

  let data;
  try {
    data = await res.json();
  } catch {
    throw new Error("mobile.de hat ungültige Daten geschickt.");
  }

  // The API answers { ads: [...] }; older responses were a plain list.
  const ads = Array.isArray(data) ? data : Array.isArray(data?.ads) ? data.ads : null;
  if (!ads) throw new Error("mobile.de: keine Anzeigenliste in der Antwort.");
  return ads;
};

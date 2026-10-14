/**
 * Web research for the AI review by Gemini with Google Search.
 *
 * Gemini only researches the car — generation, engine, known weak points,
 * recalls, causes of a defect named in the ad — and returns short German notes
 * with their sources. GPT then analyses and decides with those notes, without
 * searching itself. When Gemini is off or fails, GPT searches on its own as
 * before, so the review never depends on it.
 *
 * .env:  MARKET_RESEARCH_PROVIDER=gemini   (anything else: off)
 *        GEMINI_API_KEY=…
 *        GEMINI_RESEARCH_MODEL=…   (optional; default: newest available flash model)
 */

import { de } from "./labels";

const ENDPOINT = "https://generativelanguage.googleapis.com/v1beta/models";
// A fixed model name stops working when Google retires it, and the free tier
// has no quota for some models. So the models this key may use are looked up,
// newest "flash" first, and the first one that answers is remembered.
// GEMINI_RESEARCH_MODEL sets the first choice; the others remain the fallback.
const PINNED_MODEL = String(process.env.GEMINI_RESEARCH_MODEL || "").trim() || null;
const MAX_TRIES = 4;
let pickedModel = null;

const headers = () => ({ "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY });

/** Usable flash models of this key: newest "flash" first, then "flash-lite". */
async function flashModels(signal) {
  const response = await fetch(`${ENDPOINT}?pageSize=1000`, { headers: headers(), signal });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    throw new Error(`Modellliste ${response.status}${data?.error?.message ? ` ${data.error.message}` : ""}`);
  }
  const ids = (data?.models || [])
    .filter((model) => (model.supportedGenerationMethods || []).includes("generateContent"))
    .map((model) => String(model.name || "").replace(/^models\//, ""));
  const ranked = (pattern) =>
    ids
      .map((id) => ({ id, match: pattern.exec(id) }))
      .filter((entry) => entry.match)
      .sort((a, b) => Number(b.match[1]) - Number(a.match[1]))
      .map((entry) => entry.id);
  return [
    ...ranked(/^gemini-(\d+(?:\.\d+)?)-flash$/),
    ...ids.filter((id) => id === "gemini-flash-latest"),
    ...ranked(/^gemini-(\d+(?:\.\d+)?)-flash-lite$/),
    ...ids.filter((id) => id === "gemini-flash-lite-latest"),
  ];
}

/** First sentence of Google's message, short enough for one line. */
function shortReason(text) {
  const value = String(text || "").replace(/\s+/g, " ").trim();
  const sentence = value.match(/^.{20,180}?[.!?](\s|$)/);
  return (sentence ? sentence[0] : value).trim().slice(0, 180);
}

export function geminiResearchEnabled() {
  return String(process.env.MARKET_RESEARCH_PROVIDER || "").toLowerCase() === "gemini" && Boolean(process.env.GEMINI_API_KEY);
}

function researchPrompt(target, belt, powerDoubt) {
  const vehicle = [
    target.make,
    target.model,
    target.variant,
    target.title && target.title !== `${target.make} ${target.model}` ? `(Anzeige: ${target.title})` : null,
  ].filter(Boolean).join(" ");
  const facts = [
    `Fahrzeug: ${vehicle}`,
    target.firstRegistration ? `Erstzulassung: ${target.firstRegistration}` : null,
    Number.isFinite(target.mileageKm) ? `Kilometerstand: ${target.mileageKm.toLocaleString("de-DE")} km` : null,
    Number.isFinite(target.powerPs) ? `Leistung laut Anzeige: ${target.powerPs} PS` : null,
    powerDoubt ? `PS-Angabe der Anzeige vermutlich falsch – gleiche Modelle haben meist ${powerDoubt.marketPs} PS` : null,
    Number.isFinite(target.displacementCcm) ? `Hubraum: ${target.displacementCcm} cm³` : null,
    target.fuel && target.fuel !== "UNKNOWN" ? `Kraftstoff: ${de("fuel", target.fuel)}` : null,
    target.gearbox && target.gearbox !== "UNKNOWN" ? `Getriebe: ${de("gearbox", target.gearbox)}` : null,
    belt?.engine ? `Motor (vom System erkannt): ${belt.engine}` : null,
  ].filter(Boolean);
  const ad = String(target.description || "").replace(/\s+/g, " ").slice(0, 1500);

  return [
    "Recherchiere mit der Google-Suche Fakten zu genau diesem Gebrauchtwagen für einen deutschen Autohändler, der überlegt, ihn anzukaufen.",
    "",
    ...facts,
    ad ? `Anzeigentext (Auszug): ${ad}` : "",
    "",
    "Finde und fasse knapp zusammen (deutsch, Stichpunkte, insgesamt höchstens 300 Wörter):",
    "1. Modellgeneration und ihr Produktionszeitraum (Start und Ende in Deutschland).",
    "2. Motor: Motorcode/Familie und ob Steuerkette oder Zahnriemen, mit Wechselintervall falls Riemen.",
    "3. Bekannte, wiederholt auftretende technische Schwachstellen genau dieses Modells/Motors, die Geld kosten (mit typischer Laufleistung). Keine Kleinigkeiten, keine Einzelbefunde aus einem Testwagen.",
    "4. Rückrufe (KBA/Hersteller), die dieses Baujahr betreffen.",
    "5. Nur falls der Anzeigentext einen Defekt oder ein Symptom nennt: typische Ursachen genau dafür bei diesem Motor.",
    "Bevorzuge deutschsprachige Fachquellen (ADAC, KBA, Fachpresse, Fachforen). Keine Preise oder Marktwerte. Schreib 'nicht gefunden', wenn du zu einem Punkt nichts Verlässliches findest – nichts erfinden.",
  ].join("\n");
}

/**
 * @returns {Promise<{provider:string, model:string, notes:string, sources:{url:string,title:string}[], searches:number}|{provider:string, model:string, error:string}|null>}
 *   null when Gemini is off; { error } when it failed or found nothing usable —
 *   the page shows that, and GPT searches itself instead.
 */
export async function researchWithGemini(result, { timeoutMs = 25_000 } = {}) {
  if (!geminiResearchEnabled()) return null;
  const target = result.target || {};
  let model = null;
  const failed = (reason) => {
    console.error("gemini research failed –", reason);
    return { provider: "gemini", model: model || null, error: shortReason(reason) || "unbekannter Fehler" };
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  const body = JSON.stringify({
    contents: [{ role: "user", parts: [{ text: researchPrompt(target, result.insights?.belt, result.meta?.powerDoubt) }] }],
    tools: [{ google_search: {} }],
    generationConfig: { maxOutputTokens: 8192 },
  });
  const ask = (name) =>
    fetch(`${ENDPOINT}/${encodeURIComponent(name)}:generateContent`, {
      method: "POST",
      headers: headers(),
      body,
      signal: controller.signal,
    });

  try {
    // The remembered model first; the list is only fetched when needed.
    let queue = [pickedModel || PINNED_MODEL].filter(Boolean);
    let listed = false;
    let response = null;
    let data = null;
    for (let tries = 0; tries < MAX_TRIES; tries += 1) {
      if (!queue.length && !listed) {
        listed = true;
        const tried = new Set([pickedModel, PINNED_MODEL, model].filter(Boolean));
        queue = (await flashModels(controller.signal)).filter((id) => !tried.has(id));
      }
      if (!queue.length) break;
      model = queue.shift();
      response = await ask(model);
      data = await response.json().catch(() => null);
      // 404: model retired · 429: no (free) quota left for this model → next one.
      if (response.status !== 404 && response.status !== 429) break;
    }
    if (!response) return failed("kein passendes Gemini-Modell für diesen Schlüssel");
    if (response.ok) pickedModel = model;
    else if (pickedModel === model) pickedModel = null;
    if (!response.ok) {
      return failed(`${response.status}${data?.error?.message ? ` ${data.error.message}` : ""}`);
    }

    const candidate = data?.candidates?.[0] || {};
    const notes = (candidate.content?.parts || [])
      .map((part) => part.text || "")
      .join("")
      .trim();
    if (notes.length < 40) {
      const why = candidate.finishReason && candidate.finishReason !== "STOP" ? ` (${candidate.finishReason})` : "";
      return failed(`keine verwertbare Antwort${why}`);
    }

    const meta = candidate.groundingMetadata || {};
    const seen = new Set();
    const sources = [];
    for (const chunk of meta.groundingChunks || []) {
      const url = chunk.web?.uri;
      if (!url || seen.has(url)) continue;
      seen.add(url);
      // Gemini links run through a Google redirect; its title is the site.
      sources.push({ url, title: String(chunk.web?.title || "").slice(0, 120) || "Quelle" });
      if (sources.length >= 8) break;
    }

    return {
      provider: "gemini",
      model,
      notes: notes.slice(0, 6000),
      sources,
      searches: Array.isArray(meta.webSearchQueries) ? meta.webSearchQueries.length : sources.length ? 1 : 0,
    };
  } catch (error) {
    return failed(
      error?.name === "AbortError" ? `keine Antwort nach ${Math.round(timeoutMs / 1000)} s` : error?.message || "Verbindungsfehler",
    );
  } finally {
    clearTimeout(timer);
  }
}

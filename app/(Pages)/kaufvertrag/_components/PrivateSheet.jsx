"use client";

// The TÜV-SÜD form with its boxes – filled in on screen (form) or shown read-only (view, print, PDF).

import { forwardRef } from "react";
import { FORM_BOX, FORM_CHECK, FORM_H, FORM_W, privateDocumentOptions } from "@/lib/privateContract";
import { euroInWords } from "@/lib/germanNumber";

/** form box → [group, key] in the data */
export const FIELDS = {
  sellerName: ["seller", "name"],
  sellerZip: ["seller", "zip"],
  sellerCity: ["seller", "city"],
  sellerStreet: ["seller", "street"],
  sellerPhone: ["seller", "phone"],
  buyerName: ["buyer", "name"],
  buyerZip: ["buyer", "zip"],
  buyerCity: ["buyer", "city"],
  buyerStreet: ["buyer", "street"],
  buyerPhone: ["buyer", "phone"],
  buyerId: ["buyer", "idNumber"],
  maker: ["car", "maker"],
  type: ["car", "type"],
  plate: ["car", "plate"],
  firstRegistration: ["car", "firstRegistration"],
  zb2: ["car", "zb2"],
  vin: ["car", "vin"],
  nextHu: ["car", "nextHu"],
  mileage: ["car", "mileage"],
  owners: ["car", "owners"],
  extras: ["car", "extras"],
  price: [null, "price"],
  priceWords: [null, "priceWords"],
  damagesText: ["guarantees", "damagesText"],
  engineKm: ["guarantees", "engineKm"],
  special: [null, "special"],
  placeSeller: [null, "placeSeller"],
  dateSeller: [null, "dateSeller"],
  placeBuyer: [null, "placeBuyer"],
  dateBuyer: [null, "dateBuyer"],
};

const LABELS = {
  sellerName: "Verkäufer Name, Vorname",
  sellerZip: "Verkäufer PLZ",
  sellerCity: "Verkäufer Ort",
  sellerStreet: "Verkäufer Straße, Hausnummer",
  sellerPhone: "Verkäufer Telefon",
  buyerName: "Käufer Name, Vorname",
  buyerZip: "Käufer PLZ",
  buyerCity: "Käufer Ort",
  buyerStreet: "Käufer Straße, Hausnummer",
  buyerPhone: "Käufer Telefon",
  buyerId: "Pass-/Personalausweis-Nummer, ausstellende Behörde",
  maker: "Hersteller",
  type: "Typ",
  plate: "Amtl. Kennzeichen",
  firstRegistration: "Erstzulassung",
  zb2: "Zulassungsbescheinigung Teil 2 (Kfz-Brief)-Nr.",
  vin: "Fahrzeug-Ident-Nr",
  nextHu: "Nächste HU",
  mileage: "Abgelesener km-Stand",
  owners: "Anzahl der Vorbesitzer",
  extras: "Mitverkaufte/s Zubehör/Zusatzausstattung",
  price: "Kaufpreis Euro",
  priceWords: "Kaufpreis in Worten",
  damagesText: "Schäden (Zahl, Art, Umfang)",
  engineKm: "Laufleistung Motor (km)",
  special: "Sondervereinbarungen",
  placeSeller: "Ort (Verkäufer)",
  dateSeller: "Datum (Verkäufer)",
  placeBuyer: "Ort (Käufer)",
  dateBuyer: "Datum (Käufer)",
};

export const CHECKS = {
  notCommercial: ["guarantees", "nicht gewerblich genutzt"],
  accidentFree: ["guarantees", "unfallfrei"],
  noOtherDamage: ["guarantees", "keinen sonstigen Schaden"],
  onlyDamages: ["guarantees", "nur folgende Schäden"],
  originalEngine: ["guarantees", "mit dem Original-Motor"],
  exchangeEngine: ["guarantees", "mit einem Austausch-/Ersatzmotor"],
  engineKmCheck: ["guarantees", "Laufleistung (Motor)"],
  kmCorrect: ["guarantees", "km-Stand entspricht der Gesamtlaufleistung"],
  ownersCorrect: ["guarantees", "Anzahl der Vorbesitzer stimmt"],
  reregister: ["buyerDecl", "Käufer meldet das Fahrzeug um"],
  retention: ["buyerDecl", "Eigentumsvorbehalt"],
};

const pct = (v, of) => `${(v / of) * 100}%`;
const normVin = (v) => String(v || "").replace(/\s+/g, "").toUpperCase();

// Page coordinates of the TÜV logo area and the exclusion paragraph beneath
// the price. Cropping the source image keeps omitted content out of print and PDF.
const HEADER_BOTTOM = 102;
const HEADER_TEXT_RIGHT = 485;
const EXCLUSION_TOP = 491;
const EXCLUSION_BOTTOM = 543;
const EXCLUSION_HEIGHT = EXCLUSION_BOTTOM - EXCLUSION_TOP;
// With the company logo the TÜV notes are left out: the line "Je ein Exemplar
// für Käufer und Verkäufer" above the title and the vertical TÜV SÜD line on
// the right edge (the form boxes end at x 559).
const TITLE_TOP = 40;
const BOXES_RIGHT = 563;

function FormImageSlice({ from, to, top = from, right = FORM_W }) {
  const height = to - from;
  return (
    <div
      className="pointer-events-none absolute left-0 overflow-hidden"
      style={{ top: pct(top, FORM_H), height: pct(height, FORM_H), width: pct(right, FORM_W) }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/forms/kaufvertrag-privat.webp"
        alt=""
        draggable={false}
        className="absolute left-0"
        style={{ top: pct(-from, height), width: pct(FORM_W, right), height: pct(FORM_H, height), maxWidth: "none" }}
      />
    </div>
  );
}

function FormBackground({ logo, includeWarrantyExclusion }) {
  const companyLogo = logo === "company";
  return (
    <>
      {companyLogo ? (
        <>
          <FormImageSlice from={TITLE_TOP} to={HEADER_BOTTOM} right={HEADER_TEXT_RIGHT} />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/logo11.png"
            alt="Autogalerie Jülich"
            draggable={false}
            className="pointer-events-none absolute object-contain"
            style={{ left: pct(430, FORM_W), top: pct(10, FORM_H), width: pct(155, FORM_W), height: pct(92, FORM_H) }}
          />
        </>
      ) : null}
      <FormImageSlice
        from={companyLogo ? HEADER_BOTTOM : 0}
        to={includeWarrantyExclusion ? FORM_H : EXCLUSION_TOP}
        right={companyLogo ? BOXES_RIGHT : FORM_W}
      />
      {includeWarrantyExclusion ? null : (
        <FormImageSlice from={EXCLUSION_BOTTOM} to={FORM_H} top={EXCLUSION_TOP} right={companyLogo ? BOXES_RIGHT : FORM_W} />
      )}
    </>
  );
}

function fieldTop(top, includeWarrantyExclusion) {
  return pct(!includeWarrantyExclusion && top >= EXCLUSION_BOTTOM ? top - EXCLUSION_HEIGHT : top, FORM_H);
}

/** one input exactly over its box on the form */
function SheetInput({ id, value, onChange, placeholder, mono, readOnly, includeWarrantyExclusion }) {
  const [top, left, right, h = 16.5] = FORM_BOX[id];
  const small = h < 10;
  return (
    <input
      aria-label={LABELS[id]}
      title={LABELS[id]}
      value={value ?? ""}
      placeholder={placeholder}
      onChange={readOnly ? undefined : (e) => onChange(e.target.value)}
      readOnly={readOnly}
      tabIndex={readOnly ? -1 : undefined}
      spellCheck={false}
      autoComplete="off"
      className={`absolute rounded-[1px] border-0 px-[0.67cqw] text-black outline-none transition placeholder:text-[#7d879a] ${
        readOnly ? "cursor-default bg-transparent" : "bg-[#d6e0fb]/70 hover:bg-[#c8d5fa] focus:bg-white focus:ring-[1.5px] focus:ring-[#1d4f91]"
      } ${mono ? "font-mono tracking-[0.03em]" : ""}`}
      style={{
        top: fieldTop(top, includeWarrantyExclusion),
        left: pct(left, FORM_W),
        width: pct(right - left, FORM_W),
        height: pct(h, FORM_H),
        fontSize: small ? "1.1cqw" : "1.6cqw",
        fontFamily: mono ? undefined : "Helvetica, Arial, sans-serif",
      }}
    />
  );
}

/** a check box of the form – clickable a bit around the little square */
function SheetCheck({ id, on, onToggle, readOnly, includeWarrantyExclusion }) {
  const [top, left] = FORM_CHECK[id];
  const pad = 2.4;
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={Boolean(on)}
      aria-label={CHECKS[id][1]}
      title={CHECKS[id][1]}
      onClick={readOnly ? undefined : onToggle}
      tabIndex={readOnly ? -1 : undefined}
      className="absolute flex cursor-pointer items-center justify-center rounded-[1px] hover:bg-[#1d4f91]/10 focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-[#1d4f91]"
      style={{ top: fieldTop(top - pad, includeWarrantyExclusion), left: pct(left - pad, FORM_W), width: pct(6.6 + 2 * pad, FORM_W), height: pct(6.6 + 2 * pad, FORM_H) }}
    >
      {on ? (
        <svg viewBox="0 0 10 10" className="h-[58%] w-[58%]" aria-hidden="true">
          <path d="M1 1 9 9M9 1 1 9" stroke="#000" strokeWidth="1.5" strokeLinecap="square" />
        </svg>
      ) : null}
    </button>
  );
}


/** The whole sheet: background form + all boxes */
const PrivateSheet = forwardRef(function PrivateSheet({ d, setField, toggle, readOnly = false }, ref) {
  const priceNum = Number(String(d.price ?? "").replace(/\./g, "").replace(",", ".")) || 0;
  const { logo, includeWarrantyExclusion } = privateDocumentOptions(d.documentOptions);
  return (
    <div
      ref={ref}
      aria-label="Kaufvertrag für ein gebrauchtes Kraftfahrzeug"
      className="pv-sheet relative mx-auto w-full min-w-[620px] max-w-[860px] overflow-hidden bg-white shadow-card ring-1 ring-line print:min-w-0 print:max-w-none print:shadow-none print:ring-0"
      style={{ aspectRatio: `${FORM_W} / ${FORM_H}`, containerType: "inline-size" }}
    >
      <FormBackground logo={logo} includeWarrantyExclusion={includeWarrantyExclusion} />

      {Object.keys(FIELDS).map((key) => {
        const [g, k] = FIELDS[key];
        const value = g ? d[g]?.[k] : d[k];
        return (
          <SheetInput
            key={key}
            id={key}
            mono={key === "vin" || key === "zb2"}
            readOnly={readOnly}
            includeWarrantyExclusion={includeWarrantyExclusion}
            value={key === "priceWords" && readOnly && !String(value || "").trim() && priceNum ? euroInWords(priceNum) : value}
            onChange={(val) => setField?.(key, val)}
            placeholder={!readOnly && key === "priceWords" && priceNum ? euroInWords(priceNum) : undefined}
          />
        );
      })}

      {Object.keys(CHECKS).map((key) => (
        <SheetCheck
          key={key}
          id={key}
          readOnly={readOnly}
          includeWarrantyExclusion={includeWarrantyExclusion}
          on={d[CHECKS[key][0]]?.[key]}
          onToggle={() => toggle?.(key)}
        />
      ))}
    </div>
  );
});

export default PrivateSheet;

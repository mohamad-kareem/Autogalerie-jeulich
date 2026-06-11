"use client";

import { useState, useRef } from "react";
import { Printer, RotateCcw, Tag } from "lucide-react";

const FUEL_OPTIONS = [
  "Benzin",
  "Diesel",
  "Elektro",
  "Hybrid",
  "Plug-in-Hybrid",
  "Autogas (LPG)",
  "Erdgas (CNG)",
  "Mild-Hybrid Benzin",
  "Mild-Hybrid Diesel",
];

const GEARBOX_OPTIONS = ["Schaltgetriebe", "Automatik", "Halbautomatik"];

const COLOR_OPTIONS = [
  "Schwarz",
  "Weiß",
  "Silber",
  "Grau",
  "Blau",
  "Rot",
  "Grün",
  "Braun",
  "Beige",
  "Orange",
  "Gelb",
  "Violett",
  "Gold",
];

const CONDITION_OPTIONS = [
  "Gebrauchtfahrzeug",
  "Jahreswagen",
  "Vorführwagen",
  "Neufahrzeug",
];

const CATEGORY_OPTIONS = [
  "Limousine",
  "Kombi",
  "SUV / Geländewagen",
  "Kleinwagen",
  "Coupé",
  "Cabrio",
  "Van / Minivan",
  "Pickup",
  "Sportwagen",
];

const empty = {
  make: "",
  model: "",
  modelDescription: "",
  condition: "Gebrauchtfahrzeug",
  category: "Limousine",
  firstRegistration: "",
  mileage: "",
  power: "",
  fuel: "Benzin",
  gearbox: "Schaltgetriebe",
  color: "Schwarz",
  doors: "",
  seats: "",
  vin: "",
  price: "",
  monthlyRate: "",
  highlights: ["", "", "", "", "", ""],
  location: "Jülich",
};

export default function PreisschildPage() {
  const [form, setForm] = useState(empty);
  const printRef = useRef(null);

  const set = (field, value) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setHighlight = (i, v) => {
    const next = [...form.highlights];
    next[i] = v;
    setForm((prev) => ({ ...prev, highlights: next }));
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank", "width=900,height=700");
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8" />
        <title>Preisschild – ${form.make} ${form.model}</title>
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          @page { size: A4 landscape; margin: 0; }
          body { font-family: 'Segoe UI', Arial, sans-serif; background: #fff; }
          .print-root { width: 297mm; height: 210mm; display: flex; align-items: stretch; overflow: hidden; }

          /* LEFT accent */
          .left-bar {
            width: 52px; min-width: 52px;
            background: #146c2e;
            display: flex; flex-direction: column; align-items: center; justify-content: center;
            padding: 20px 0;
            gap: 12px;
          }
          .left-bar .rot-text {
            writing-mode: vertical-rl; transform: rotate(180deg);
            font-size: 11px; font-weight: 700; letter-spacing: 0.22em;
            text-transform: uppercase; color: rgba(255,255,255,0.7);
          }
          .left-bar .diamond {
            width: 10px; height: 10px;
            background: rgba(255,255,255,0.35); transform: rotate(45deg);
          }

          /* MAIN */
          .main { flex: 1; display: flex; flex-direction: column; background: #fff; }

          /* HEADER */
          .header {
            background: #0e5724; padding: 18px 28px 16px;
            display: flex; align-items: flex-end; justify-content: space-between;
          }
          .header-left {}
          .dealer-label {
            font-size: 9px; font-weight: 700; letter-spacing: 0.2em;
            text-transform: uppercase; color: rgba(255,255,255,0.65); margin-bottom: 4px;
          }
          .car-title {
            font-size: 30px; font-weight: 800; color: #fff;
            letter-spacing: -0.03em; line-height: 1;
          }
          .car-subtitle {
            font-size: 13px; color: rgba(255,255,255,0.75);
            margin-top: 5px; font-weight: 400;
          }
          .header-right { text-align: right; }
          .condition-badge {
            display: inline-block;
            background: rgba(255,255,255,0.18); border: 1px solid rgba(255,255,255,0.3);
            border-radius: 20px; padding: 4px 14px;
            font-size: 11px; color: #fff; font-weight: 600;
            letter-spacing: 0.06em; margin-bottom: 8px;
          }
          .price-label {
            font-size: 9px; color: rgba(255,255,255,0.6);
            text-transform: uppercase; letter-spacing: 0.14em;
          }
          .price-value {
            font-size: 36px; font-weight: 800; color: #fff;
            letter-spacing: -0.03em; line-height: 1;
          }
          .price-sub {
            font-size: 10px; color: rgba(255,255,255,0.6); margin-top: 2px;
          }

          /* BODY */
          .body { flex: 1; display: flex; gap: 0; }

          /* SPECS */
          .specs-col {
            flex: 1.15; padding: 18px 24px;
            border-right: 1px solid #e8ece8;
          }
          .specs-grid {
            display: grid; grid-template-columns: 1fr 1fr; gap: 0;
          }
          .spec-item {
            padding: 9px 10px; border-bottom: 1px solid #f0f2f0;
            display: flex; flex-direction: column; gap: 1px;
          }
          .spec-item:nth-child(odd) { border-right: 1px solid #f0f2f0; }
          .spec-label {
            font-size: 8.5px; font-weight: 600; text-transform: uppercase;
            letter-spacing: 0.12em; color: #8a978a;
          }
          .spec-value {
            font-size: 13px; font-weight: 700; color: #101510;
          }

          /* HIGHLIGHTS */
          .highlights-col {
            width: 220px; min-width: 220px;
            padding: 18px 22px;
            border-right: 1px solid #e8ece8;
            display: flex; flex-direction: column; gap: 6px;
          }
          .highlights-title {
            font-size: 9px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.18em; color: #146c2e; margin-bottom: 4px;
          }
          .highlight-item {
            display: flex; align-items: center; gap: 8px;
            font-size: 11.5px; font-weight: 500; color: #1d241d;
          }
          .highlight-dot {
            width: 6px; height: 6px; border-radius: 50%;
            background: #146c2e; flex-shrink: 0;
          }

          /* FINANCE + VIN */
          .right-col {
            width: 170px; min-width: 170px;
            padding: 18px 20px;
            display: flex; flex-direction: column; gap: 14px;
            background: #f7faf8;
          }
          .finance-box {
            background: #e8f2eb; border-radius: 10px;
            padding: 12px 14px;
          }
          .finance-label {
            font-size: 8.5px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.14em; color: #146c2e; margin-bottom: 4px;
          }
          .finance-rate {
            font-size: 20px; font-weight: 800; color: #146c2e;
            letter-spacing: -0.02em;
          }
          .finance-sub {
            font-size: 9px; color: #4a7a55; margin-top: 2px;
          }
          .vin-box { margin-top: auto; }
          .vin-label {
            font-size: 8px; font-weight: 700; text-transform: uppercase;
            letter-spacing: 0.14em; color: #9aa39a; margin-bottom: 3px;
          }
          .vin-value {
            font-size: 9px; color: #4d554d;
            word-break: break-all; font-family: monospace;
          }
          .location-box {
            display: flex; align-items: center; gap: 6px;
            font-size: 10px; color: #5f695f;
          }
          .location-dot {
            width: 6px; height: 6px; background: #146c2e; border-radius: 50%; flex-shrink: 0;
          }

          /* FOOTER */
          .footer {
            background: #f2f5f2; border-top: 1px solid #e0e6e0;
            padding: 8px 28px;
            display: flex; align-items: center; justify-content: space-between;
          }
          .footer-dealer {
            font-size: 9px; font-weight: 700; letter-spacing: 0.1em;
            text-transform: uppercase; color: #146c2e;
          }
          .footer-addr {
            font-size: 9px; color: #7a877a;
          }
          .footer-disclaimer {
            font-size: 8px; color: #aab3aa; text-align: right;
          }
        </style>
      </head>
      <body>
        ${content.innerHTML}
      </body>
      </html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => {
      win.print();
      win.close();
    }, 400);
  };

  const formatPrice = (v) => {
    const n = parseFloat(v.replace(/[^\d.,]/g, "").replace(",", "."));
    if (isNaN(n)) return v;
    return n.toLocaleString("de-DE", {
      style: "currency",
      currency: "EUR",
      maximumFractionDigits: 0,
    });
  };

  const activeHighlights = form.highlights.filter(Boolean);

  const specs = [
    {
      label: "Erstzulassung",
      value: form.firstRegistration
        ? (() => {
            const [y, m] = form.firstRegistration.split("-");
            return m && y ? `${m}/${y}` : form.firstRegistration;
          })()
        : "",
    },
    {
      label: "Kilometerstand",
      value: form.mileage
        ? `${parseInt(form.mileage).toLocaleString("de-DE")} km`
        : "",
    },
    { label: "Kraftstoff", value: form.fuel },
    { label: "Getriebe", value: form.gearbox },
    {
      label: "Leistung",
      value: form.power
        ? `${form.power} kW (${Math.round(form.power * 1.36)} PS)`
        : "",
    },
    { label: "Farbe", value: form.color },
    { label: "Türen", value: form.doors ? `${form.doors} Türen` : "" },
    { label: "Sitze", value: form.seats ? `${form.seats} Sitze` : "" },
    { label: "Fahrzeugklasse", value: form.category },
    { label: "Standort", value: form.location },
  ].filter((s) => s.value);

  return (
    <div className="min-h-screen bg-[#f4f5f2] pb-16 pt-6 text-[#101510]">
      <div className="mx-auto w-full max-w-[1280px] px-4 sm:px-6 lg:px-8">
        {/* ─── HEADER ─── */}
        <div className="mb-6 flex items-center justify-between">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-[#146c2e]">
              Autogalerie Jülich
            </p>
            <h1 className="mt-1 text-[26px] font-semibold tracking-[-0.04em] text-[#07111f]">
              Preisschild erstellen
            </h1>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setForm(empty)}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-black/10 bg-white px-3 text-[13px] font-medium text-[#101510] transition hover:border-[#146c2e]/40 hover:bg-[#f1f6f2]"
            >
              <RotateCcw className="h-4 w-4" />
              Zurücksetzen
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex h-10 items-center gap-1.5 rounded-xl bg-[#146c2e] px-4 text-[13px] font-semibold text-white shadow-md shadow-green-900/15 transition hover:bg-[#0f5724]"
            >
              <Printer className="h-4 w-4" />
              Drucken (A4 Quer)
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
          {/* ─── FORM ─── */}
          <div className="space-y-5">
            {/* Fahrzeugdaten */}
            <Section title="Fahrzeugdaten" icon={<Tag className="h-4 w-4" />}>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Marke *">
                  <input
                    value={form.make}
                    onChange={(e) => set("make", e.target.value)}
                    placeholder="z. B. BMW"
                  />
                </Field>
                <Field label="Modell *">
                  <input
                    value={form.model}
                    onChange={(e) => set("model", e.target.value)}
                    placeholder="z. B. 3er"
                  />
                </Field>
                <Field label="Modellbeschreibung" className="col-span-2">
                  <input
                    value={form.modelDescription}
                    onChange={(e) => set("modelDescription", e.target.value)}
                    placeholder="z. B. 320d xDrive M Sport"
                  />
                </Field>
                <Field label="Zustand">
                  <select
                    value={form.condition}
                    onChange={(e) => set("condition", e.target.value)}
                  >
                    {CONDITION_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Fahrzeugklasse">
                  <select
                    value={form.category}
                    onChange={(e) => set("category", e.target.value)}
                  >
                    {CATEGORY_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </Field>
              </div>
            </Section>

            {/* Technische Daten */}
            <Section title="Technische Daten">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Erstzulassung">
                  <input
                    type="month"
                    value={form.firstRegistration}
                    onChange={(e) => set("firstRegistration", e.target.value)}
                  />
                </Field>
                <Field label="Kilometerstand (km)">
                  <input
                    type="number"
                    value={form.mileage}
                    onChange={(e) => set("mileage", e.target.value)}
                    placeholder="z. B. 45000"
                  />
                </Field>
                <Field label="Leistung (kW)">
                  <input
                    type="number"
                    value={form.power}
                    onChange={(e) => set("power", e.target.value)}
                    placeholder="z. B. 140"
                  />
                </Field>
                <Field label="Kraftstoff">
                  <select
                    value={form.fuel}
                    onChange={(e) => set("fuel", e.target.value)}
                  >
                    {FUEL_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Getriebe">
                  <select
                    value={form.gearbox}
                    onChange={(e) => set("gearbox", e.target.value)}
                  >
                    {GEARBOX_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Farbe">
                  <select
                    value={form.color}
                    onChange={(e) => set("color", e.target.value)}
                  >
                    {COLOR_OPTIONS.map((o) => (
                      <option key={o}>{o}</option>
                    ))}
                  </select>
                </Field>
                <Field label="Türen">
                  <input
                    type="number"
                    min="2"
                    max="5"
                    value={form.doors}
                    onChange={(e) => set("doors", e.target.value)}
                    placeholder="z. B. 4"
                  />
                </Field>
                <Field label="Sitze">
                  <input
                    type="number"
                    min="1"
                    max="9"
                    value={form.seats}
                    onChange={(e) => set("seats", e.target.value)}
                    placeholder="z. B. 5"
                  />
                </Field>
                <Field label="Standort" className="col-span-2">
                  <input
                    value={form.location}
                    onChange={(e) => set("location", e.target.value)}
                    placeholder="z. B. Jülich"
                  />
                </Field>
              </div>
            </Section>

            {/* Preis */}
            <Section title="Preis">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Verkaufspreis (€) *">
                  <input
                    value={form.price}
                    onChange={(e) => set("price", e.target.value)}
                    placeholder="z. B. 24900"
                  />
                </Field>
                <Field label="Monatliche Rate (€)">
                  <input
                    value={form.monthlyRate}
                    onChange={(e) => set("monthlyRate", e.target.value)}
                    placeholder="z. B. 299"
                  />
                </Field>
              </div>
            </Section>

            {/* Highlights */}
            <Section title="Highlights (bis zu 6)">
              <div className="grid grid-cols-2 gap-2.5">
                {form.highlights.map((h, i) => (
                  <Field key={i} label={`Highlight ${i + 1}`}>
                    <input
                      value={h}
                      onChange={(e) => setHighlight(i, e.target.value)}
                      placeholder="z. B. Panoramadach"
                    />
                  </Field>
                ))}
              </div>
            </Section>

            {/* VIN */}
            <Section title="Weitere Angaben">
              <Field label="Fahrgestellnummer (VIN)">
                <input
                  value={form.vin}
                  onChange={(e) => set("vin", e.target.value)}
                  placeholder="z. B. WBA12345678901234"
                  className="font-mono"
                />
              </Field>
            </Section>
          </div>

          {/* ─── PREVIEW ─── */}
          <div className="lg:sticky lg:top-6">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#8b958b]">
              Vorschau — A4 Querformat
            </p>
            <div className="overflow-x-auto rounded-2xl border border-black/[0.08] shadow-xl shadow-black/10">
              {/* Scale the 297mm × 210mm sheet into the preview column */}
              <div
                style={{
                  width: "100%",
                  aspectRatio: "297/210",
                  position: "relative",
                  background: "#fff",
                  overflow: "hidden",
                }}
              >
                <div
                  style={{
                    transform: "scale(0.492)",
                    transformOrigin: "top left",
                    width: "1122px",
                    height: "794px",
                    position: "absolute",
                    top: 0,
                    left: 0,
                  }}
                >
                  <PrintLayout
                    form={form}
                    specs={specs}
                    activeHighlights={activeHighlights}
                    formatPrice={formatPrice}
                  />
                </div>
              </div>
            </div>
            <p className="mt-2.5 text-center text-[11px] text-[#9aa39a]">
              Klick auf „Drucken" öffnet den Druckdialog im A4-Querformat
            </p>
          </div>
        </div>
      </div>

      {/* Hidden print target */}
      <div style={{ display: "none" }}>
        <div ref={printRef}>
          <PrintLayout
            form={form}
            specs={specs}
            activeHighlights={activeHighlights}
            formatPrice={formatPrice}
          />
        </div>
      </div>

      <style>{`
        .pf-input input, .pf-input select {
          width: 100%;
          height: 38px;
          background: #fff;
          border: 1.5px solid rgba(0,0,0,0.1);
          border-radius: 10px;
          padding: 0 12px;
          font-size: 13px;
          color: #101510;
          outline: none;
          transition: border-color 0.15s;
        }
        .pf-input input:focus, .pf-input select:focus {
          border-color: #146c2e;
          box-shadow: 0 0 0 3px rgba(20,108,46,0.1);
        }
        .pf-input input::placeholder { color: #b0bab0; }
      `}</style>
    </div>
  );
}

/* ── FORM HELPERS ── */
function Section({ title, icon, children }) {
  return (
    <div className="rounded-2xl border border-black/[0.06] bg-white p-5 shadow-[0_6px_20px_-10px_rgba(7,17,31,0.12)]">
      <h2 className="mb-4 flex items-center gap-2 text-[13px] font-semibold uppercase tracking-[0.12em] text-[#146c2e]">
        {icon}
        {title}
      </h2>
      {children}
    </div>
  );
}

function Field({ label, children, className = "" }) {
  return (
    <div className={`pf-input flex flex-col gap-1.5 ${className}`}>
      <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-[#7b857b]">
        {label}
      </label>
      {children}
    </div>
  );
}

/* ── PRINT LAYOUT ── */
function PrintLayout({ form, specs, activeHighlights, formatPrice }) {
  const priceDisplay = form.price ? formatPrice(form.price) : "Auf Anfrage";
  const monthlyDisplay = form.monthlyRate
    ? `ab ${formatPrice(form.monthlyRate)}/Monat`
    : null;
  const titleLine =
    [form.make, form.model].filter(Boolean).join(" ") || "Fahrzeugbezeichnung";
  const powerPS = form.power
    ? `${form.power} kW (${Math.round(form.power * 1.36)} PS)`
    : null;

  return (
    <div
      className="print-root"
      style={{
        width: "1122px",
        height: "794px",
        display: "flex",
        fontFamily: "'Segoe UI', Arial, sans-serif",
        background: "#fff",
      }}
    >
      {/* LEFT BAR */}
      <div
        style={{
          width: "52px",
          minWidth: "52px",
          background: "#146c2e",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "20px 0",
          gap: "12px",
        }}
      >
        <div
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "10px",
            fontWeight: 700,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(255,255,255,0.65)",
          }}
        >
          Autogalerie Jülich
        </div>
        <div
          style={{
            width: "10px",
            height: "10px",
            background: "rgba(255,255,255,0.3)",
            transform: "rotate(45deg)",
          }}
        />
        <div
          style={{
            writingMode: "vertical-rl",
            transform: "rotate(180deg)",
            fontSize: "9px",
            letterSpacing: "0.14em",
            color: "rgba(255,255,255,0.4)",
          }}
        >
          Gebrauchtfahrzeuge
        </div>
      </div>

      {/* MAIN */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          background: "#fff",
          overflow: "hidden",
        }}
      >
        {/* HEADER */}
        <div
          style={{
            background: "#0e5724",
            padding: "22px 32px 18px",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.2em",
                textTransform: "uppercase",
                color: "rgba(255,255,255,0.6)",
                marginBottom: "6px",
              }}
            >
              Autogalerie Jülich · {form.condition || "Gebrauchtfahrzeug"}
            </div>
            <div
              style={{
                fontSize: "38px",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              {titleLine}
            </div>
            {form.modelDescription && (
              <div
                style={{
                  fontSize: "14px",
                  color: "rgba(255,255,255,0.72)",
                  marginTop: "6px",
                  fontWeight: 400,
                }}
              >
                {form.modelDescription}
              </div>
            )}
          </div>

          <div
            style={{ textAlign: "right", flexShrink: 0, marginLeft: "24px" }}
          >
            <div
              style={{
                display: "inline-block",
                background: "rgba(255,255,255,0.16)",
                border: "1px solid rgba(255,255,255,0.28)",
                borderRadius: "20px",
                padding: "4px 16px",
                fontSize: "11px",
                color: "#fff",
                fontWeight: 600,
                letterSpacing: "0.06em",
                marginBottom: "10px",
              }}
            >
              {form.condition || "Gebrauchtfahrzeug"}
            </div>
            <div
              style={{
                fontSize: "9px",
                color: "rgba(255,255,255,0.55)",
                textTransform: "uppercase",
                letterSpacing: "0.14em",
              }}
            >
              Gesamtpreis inkl. MwSt.
            </div>
            <div
              style={{
                fontSize: "44px",
                fontWeight: 800,
                color: "#fff",
                letterSpacing: "-0.03em",
                lineHeight: 1,
                marginTop: "3px",
              }}
            >
              {priceDisplay}
            </div>
            {monthlyDisplay && (
              <div
                style={{
                  fontSize: "11px",
                  color: "rgba(255,255,255,0.6)",
                  marginTop: "3px",
                }}
              >
                {monthlyDisplay}
              </div>
            )}
          </div>
        </div>

        {/* BODY */}
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          {/* SPECS */}
          <div
            style={{
              flex: 1.2,
              padding: "20px 26px",
              borderRight: "1px solid #e8ece8",
              overflowY: "hidden",
            }}
          >
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 0,
              }}
            >
              {specs.slice(0, 10).map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: "9px 10px",
                    borderBottom: "1px solid #f0f2f0",
                    borderRight: i % 2 === 0 ? "1px solid #f0f2f0" : "none",
                    display: "flex",
                    flexDirection: "column",
                    gap: "2px",
                  }}
                >
                  <div
                    style={{
                      fontSize: "8px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.12em",
                      color: "#8a978a",
                    }}
                  >
                    {s.label}
                  </div>
                  <div
                    style={{
                      fontSize: "14px",
                      fontWeight: 700,
                      color: "#101510",
                    }}
                  >
                    {s.value}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* HIGHLIGHTS */}
          {activeHighlights.length > 0 && (
            <div
              style={{
                width: "220px",
                minWidth: "220px",
                padding: "20px 22px",
                borderRight: "1px solid #e8ece8",
                display: "flex",
                flexDirection: "column",
                gap: "0",
              }}
            >
              <div
                style={{
                  fontSize: "8.5px",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.18em",
                  color: "#146c2e",
                  marginBottom: "12px",
                }}
              >
                Highlights
              </div>
              {activeHighlights.map((h, i) => (
                <div
                  key={i}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "9px",
                    fontSize: "12px",
                    fontWeight: 500,
                    color: "#1d241d",
                    padding: "6px 0",
                    borderBottom:
                      i < activeHighlights.length - 1
                        ? "1px dashed #e8ece8"
                        : "none",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      borderRadius: "50%",
                      background: "#146c2e",
                      flexShrink: 0,
                    }}
                  />
                  {h}
                </div>
              ))}
            </div>
          )}

          {/* RIGHT: Finance + VIN */}
          <div
            style={{
              width: "170px",
              minWidth: "170px",
              padding: "20px 20px",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "#f7faf8",
            }}
          >
            {monthlyDisplay && (
              <div
                style={{
                  background: "#e8f2eb",
                  borderRadius: "10px",
                  padding: "13px 15px",
                }}
              >
                <div
                  style={{
                    fontSize: "8px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#146c2e",
                    marginBottom: "5px",
                  }}
                >
                  Finanzierung ab
                </div>
                <div
                  style={{
                    fontSize: "22px",
                    fontWeight: 800,
                    color: "#146c2e",
                    letterSpacing: "-0.02em",
                  }}
                >
                  {formatPrice(form.monthlyRate)}
                </div>
                <div
                  style={{
                    fontSize: "9px",
                    color: "#4a7a55",
                    marginTop: "3px",
                  }}
                >
                  / Monat
                </div>
              </div>
            )}
            {powerPS && (
              <div>
                <div
                  style={{
                    fontSize: "8px",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.14em",
                    color: "#8a978a",
                    marginBottom: "4px",
                  }}
                >
                  Leistung
                </div>
                <div
                  style={{
                    fontSize: "16px",
                    fontWeight: 700,
                    color: "#101510",
                  }}
                >
                  {powerPS}
                </div>
              </div>
            )}
            <div style={{ marginTop: "auto" }}>
              {form.location && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    fontSize: "11px",
                    color: "#5f695f",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "6px",
                      height: "6px",
                      background: "#146c2e",
                      borderRadius: "50%",
                      flexShrink: 0,
                    }}
                  />
                  Standort: {form.location}
                </div>
              )}
              {form.vin && (
                <div>
                  <div
                    style={{
                      fontSize: "7.5px",
                      fontWeight: 700,
                      textTransform: "uppercase",
                      letterSpacing: "0.14em",
                      color: "#9aa39a",
                      marginBottom: "3px",
                    }}
                  >
                    FIN / VIN
                  </div>
                  <div
                    style={{
                      fontSize: "8.5px",
                      color: "#4d554d",
                      wordBreak: "break-all",
                      fontFamily: "monospace",
                    }}
                  >
                    {form.vin}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* FOOTER */}
        <div
          style={{
            background: "#f2f5f2",
            borderTop: "1px solid #e0e6e0",
            padding: "9px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexShrink: 0,
          }}
        >
          <div>
            <div
              style={{
                fontSize: "9px",
                fontWeight: 700,
                letterSpacing: "0.1em",
                textTransform: "uppercase",
                color: "#146c2e",
              }}
            >
              Autogalerie Jülich
            </div>
            <div style={{ fontSize: "9px", color: "#7a877a" }}>
              Alte Dürenerstraße 4 · 52428 Jülich · 02461 916006613
            </div>
          </div>
          <div
            style={{ fontSize: "7.5px", color: "#aab3aa", textAlign: "right" }}
          >
            Alle Angaben ohne Gewähr · Preise inkl. MwSt. · Irrtümer vorbehalten
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useRef, useCallback } from "react";

const FUELS = [
  "Benzin",
  "Diesel",
  "Elektro",
  "Hybrid",
  "Plug-in-Hybrid",
  "LPG",
  "CNG",
];
const GEARBOXES = ["Schaltgetriebe", "Automatik", "Halbautomatik"];
const CONDITIONS = [
  "Gebrauchtfahrzeug",
  "Jahreswagen",
  "Vorführwagen",
  "Neufahrzeug",
];
const CATEGORIES = [
  "Limousine",
  "Kombi",
  "SUV / Geländewagen",
  "Kleinwagen",
  "Coupé",
  "Cabrio",
  "Van",
  "Pickup",
  "Sportwagen",
];
const EMISSION_CLASSES = ["Euro6", "Euro5", "Euro4", "Euro3", "Euro2", "Euro1"];

const EMPTY = {
  category: "Limousine",
  condition: "Gebrauchtfahrzeug",
  title: "",
  subtitle: "",
  firstReg: "",
  fuel: "Benzin",
  gearbox: "Schaltgetriebe",
  mileage: "",
  power: "",
  cubicCapacity: "",
  color: "",
  hu: "",
  emissionClass: "Euro6",
  co2: "",
  consumption: "",
  equipment: "",
  description: "",
  price: "",

  imageDataUrl: null,
};

const fmtReg = (v) => {
  if (!v) return "";
  const [y, m] = v.split("-");
  return m && y ? `${m}/${y}` : v;
};
const fmtKm = (v) => {
  const n = parseInt(v);
  if (isNaN(n)) return "";
  return n.toLocaleString("de-DE") + " km";
};
const fmtPrice = (v) => {
  const n = parseFloat(
    String(v)
      .replace(/[^\d,.]/g, "")
      .replace(",", "."),
  );
  if (isNaN(n)) return v;
  return (
    n.toLocaleString("de-DE", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }) + " €"
  );
};

export default function PreisschildPage() {
  const [f, setF] = useState(EMPTY);
  const [dragging, setDragging] = useState(false);
  const printRef = useRef(null);
  const fileRef = useRef(null);

  const s = (k) => (e) => setF((p) => ({ ...p, [k]: e.target.value }));
  const loadImage = (file) => {
    if (!file || !file.type.startsWith("image/")) return;
    const r = new FileReader();
    r.onload = (e) => setF((p) => ({ ...p, imageDataUrl: e.target.result }));
    r.readAsDataURL(file);
  };
  const onDrop = useCallback((e) => {
    e.preventDefault();
    setDragging(false);
    loadImage(e.dataTransfer.files[0]);
  }, []);

  const handlePrint = () => {
    const el = printRef.current;
    if (!el) return;
    const w = window.open("", "_blank", "width=900,height=1200");
    w.document.write(`<!DOCTYPE html><html><head><meta charset="UTF-8">
<title>Preisschild – ${f.title}</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
@page{size:A4 portrait;margin:15mm 15mm 12mm 15mm}
body{font-family:Arial,sans-serif;background:#fff;color:#000;-webkit-print-color-adjust:exact;print-color-adjust:exact}
</style></head><body>${el.innerHTML}</body></html>`);
    w.document.close();
    w.focus();
    setTimeout(() => {
      w.print();
      w.close();
    }, 600);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f0f0ee",
        paddingBottom: "4rem",
      }}
    >
      {/* TOPBAR */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #ddd",
        }}
      >
        <div
          style={{
            maxWidth: "1280px",
            margin: "0 auto",
            padding: "16px 32px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "16px",
          }}
        >
          <div>
            <h1
              style={{
                fontSize: "18px",
                fontWeight: 700,
                color: "#111",
                margin: 0,
              }}
            >
              Preisschild erstellen
            </h1>
          </div>

          <div
            style={{
              display: "flex",
              gap: "8px",
              alignItems: "center",
              flexShrink: 0,
            }}
          >
            <button
              onClick={() => setF(EMPTY)}
              style={{
                height: "34px",
                minWidth: "120px",
                padding: "0 14px",
                borderRadius: "6px",
                border: "1px solid #ccc",
                background: "#fff",
                fontSize: "12px",
                color: "#444",
                cursor: "pointer",
              }}
            >
              Zurücksetzen
            </button>

            <button
              onClick={handlePrint}
              style={{
                height: "34px",
                minWidth: "120px",
                padding: "0 18px",
                borderRadius: "6px",
                border: "none",
                background: "#146c2e",
                fontSize: "12px",
                fontWeight: 700,
                color: "#fff",
                cursor: "pointer",
              }}
            >
              🖨 Drucken
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          maxWidth: "1280px",
          margin: "0 auto",
          padding: "28px 32px",
          display: "grid",
          gridTemplateColumns: "360px 1fr",
          gap: "28px",
          alignItems: "start",
        }}
      >
        {/* ── FORM ── */}
        <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
          <FC title="Foto">
            <div
              onClick={() => !f.imageDataUrl && fileRef.current?.click()}
              onDrop={onDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={() => setDragging(false)}
              style={{
                border: dragging ? "2px dashed #146c2e" : "2px dashed #ccc",
                borderRadius: "6px",
                background: dragging ? "#f0f7f2" : "#fafaf8",
                cursor: f.imageDataUrl ? "default" : "pointer",
                overflow: "hidden",
                transition: "all .15s",
              }}
            >
              {f.imageDataUrl ? (
                <div style={{ position: "relative" }}>
                  <img
                    src={f.imageDataUrl}
                    alt=""
                    style={{
                      width: "100%",
                      height: "150px",
                      objectFit: "cover",
                      display: "block",
                    }}
                  />
                  <div
                    style={{
                      position: "absolute",
                      top: 6,
                      right: 6,
                      display: "flex",
                      gap: 5,
                    }}
                  >
                    <SmBtn
                      onClick={(e) => {
                        e.stopPropagation();
                        fileRef.current?.click();
                      }}
                    >
                      Ändern
                    </SmBtn>
                    <SmBtn
                      onClick={(e) => {
                        e.stopPropagation();
                        setF((p) => ({ ...p, imageDataUrl: null }));
                      }}
                    >
                      ✕
                    </SmBtn>
                  </div>
                </div>
              ) : (
                <div
                  style={{
                    height: "100px",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: 6,
                  }}
                >
                  <svg
                    width="26"
                    height="26"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#aaa"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  >
                    <rect x="3" y="3" width="18" height="18" rx="2" />
                    <circle cx="8.5" cy="8.5" r="1.5" />
                    <polyline points="21 15 16 10 5 21" />
                  </svg>
                  <p style={{ fontSize: "12px", color: "#888" }}>
                    Foto ablegen oder klicken
                  </p>
                </div>
              )}
            </div>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              onChange={(e) => loadImage(e.target.files[0])}
              style={{ display: "none" }}
            />
          </FC>

          <FC title="Fahrzeugtitel">
            <Row2>
              <LF label="Kategorie">
                <select value={f.category} onChange={s("category")}>
                  {CATEGORIES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </LF>
              <LF label="Zustand">
                <select value={f.condition} onChange={s("condition")}>
                  {CONDITIONS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </LF>
            </Row2>
            <LF label="Fahrzeugtitel">
              <input
                value={f.title}
                onChange={s("title")}
                placeholder="Peugeot 208 Active *wenig km*"
              />
            </LF>
          </FC>

          <FC title="Technische Daten">
            <Row2>
              <LF label="Erstzulassung (EZ)">
                <input
                  type="month"
                  value={f.firstReg}
                  onChange={s("firstReg")}
                />
              </LF>
              <LF label="Kilometerstand">
                <input
                  type="number"
                  value={f.mileage}
                  onChange={s("mileage")}
                  placeholder="58000"
                />
              </LF>
            </Row2>
            <Row2>
              <LF label="Kraftstoff">
                <select value={f.fuel} onChange={s("fuel")}>
                  {FUELS.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </LF>
              <LF label="Leistung (kW)">
                <input
                  type="number"
                  value={f.power}
                  onChange={s("power")}
                  placeholder="50"
                />
              </LF>
            </Row2>
            <Row2>
              <LF label="Getriebe">
                <select value={f.gearbox} onChange={s("gearbox")}>
                  {GEARBOXES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </LF>
              <LF label="Hubraum (cm³)">
                <input
                  type="number"
                  value={f.cubicCapacity}
                  onChange={s("cubicCapacity")}
                  placeholder="999"
                />
              </LF>
            </Row2>
            <Row2>
              <LF label="Außenfarbe">
                <input
                  value={f.color}
                  onChange={s("color")}
                  placeholder="Grau (Metallic)"
                />
              </LF>
              <LF label="HU bis">
                <input type="month" value={f.hu} onChange={s("hu")} />
              </LF>
            </Row2>
            <Row2>
              <LF label="Schadstoffklasse">
                <select value={f.emissionClass} onChange={s("emissionClass")}>
                  {EMISSION_CLASSES.map((o) => (
                    <option key={o}>{o}</option>
                  ))}
                </select>
              </LF>
              <LF label="CO₂ (g/km)">
                <input
                  type="number"
                  value={f.co2}
                  onChange={s("co2")}
                  placeholder="102"
                />
              </LF>
            </Row2>
          </FC>

          <FC title="Ausstattung">
            <LF label="Kommagetrennte Liste">
              <textarea
                value={f.equipment}
                onChange={s("equipment")}
                placeholder="ABS, ESP, Klimaanlage, Bluetooth, Sitzheizung..."
                style={{
                  width: "100%",
                  height: "80px",
                  padding: "8px 10px",
                  border: "1px solid #ccc",
                  borderRadius: "6px",
                  fontSize: "12px",
                  fontFamily: "inherit",
                  resize: "vertical",
                  outline: "none",
                }}
              />
            </LF>
          </FC>

          <FC title="Fahrzeugbeschreibung">
            <textarea
              value={f.description}
              onChange={s("description")}
              placeholder="Zum Verkauf steht ein..."
              style={{
                width: "100%",
                height: "100px",
                padding: "8px 10px",
                border: "1px solid #ccc",
                borderRadius: "6px",
                fontSize: "12px",
                fontFamily: "inherit",
                resize: "vertical",
                outline: "none",
              }}
            />
          </FC>

          <FC title="Preis">
            <Row2>
              <LF label="Preis (€)">
                <input
                  value={f.price}
                  onChange={s("price")}
                  placeholder="5999"
                />
              </LF>
            </Row2>
          </FC>
        </div>

        {/* ── PREVIEW ── */}
        <div style={{ position: "sticky", top: "20px" }}>
          <p
            style={{
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.16em",
              textTransform: "uppercase",
              color: "#999",
              marginBottom: "10px",
            }}
          >
            Vorschau — A4 Hochformat
          </p>
          <div
            style={{
              width: "100%",
              aspectRatio: "210/297",
              position: "relative",
              background: "#fff",
              borderRadius: "8px",
              boxShadow: "0 6px 32px rgba(0,0,0,0.15)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "794px",
                height: "1123px",
                transformOrigin: "top left",
                transform: `scale(${1 / 1.485})`,
              }}
            >
              <Sheet f={f} fmtReg={fmtReg} fmtKm={fmtKm} fmtPrice={fmtPrice} />
            </div>
          </div>
          <p
            style={{
              marginTop: "8px",
              textAlign: "center",
              fontSize: "10px",
              color: "#bbb",
            }}
          >
            A4 Hochformat
          </p>
        </div>
      </div>

      <div style={{ display: "none" }} ref={printRef}>
        <Sheet f={f} fmtReg={fmtReg} fmtKm={fmtKm} fmtPrice={fmtPrice} />
      </div>

      <style>{`
        input,select{width:100%;height:32px;padding:0 8px;border:1px solid #ccc;border-radius:5px;font-size:12px;color:#111;background:#fff;outline:none;font-family:inherit;}
        input:focus,select:focus{border-color:#146c2e;box-shadow:0 0 0 2px rgba(20,108,46,0.1);}
        input::placeholder{color:#bbb;}
      `}</style>
    </div>
  );
}

function FC({ title, children }) {
  return (
    <div
      style={{
        background: "#fff",
        borderRadius: "8px",
        border: "1px solid #ddd",
        padding: "14px 16px",
      }}
    >
      <p
        style={{
          fontSize: "9px",
          fontWeight: 700,
          letterSpacing: "0.16em",
          textTransform: "uppercase",
          color: "#146c2e",
          marginBottom: "12px",
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
        {children}
      </div>
    </div>
  );
}
function Row2({ children }) {
  return (
    <div
      style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}
    >
      {children}
    </div>
  );
}
function LF({ label, children }) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <label style={{ fontSize: "10px", fontWeight: 600, color: "#666" }}>
        {label}
      </label>
      {children}
    </div>
  );
}
function SmBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        height: "24px",
        padding: "0 8px",
        borderRadius: "4px",
        border: "none",
        background: "rgba(0,0,0,0.5)",
        color: "#fff",
        fontSize: "10px",
        fontWeight: 700,
        cursor: "pointer",
      }}
    >
      {children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════════
   PRINT SHEET
   Base: 794 × 1123 px (A4 at 96 dpi)
   All font sizes bumped ~20% from previous version
   so printed output is comfortably readable.
═══════════════════════════════════════════════════════ */
function Sheet({ f, fmtReg, fmtKm, fmtPrice }) {
  const hasImg = !!f.imageDataUrl;
  const ps = f.power ? parseInt(f.power) : null;

  const techLeft = [
    f.firstReg && `EZ: ${fmtReg(f.firstReg)}`,
    f.fuel && `Kraftstoffart: ${f.fuel}`,
    f.gearbox && `Getriebe: ${f.gearbox}`,
    f.cubicCapacity &&
      `Hubraum: ${parseInt(f.cubicCapacity).toLocaleString("de-DE")} cm³`,
    f.color && `Außenfarbe: ${f.color}`,
  ].filter(Boolean);

  const techRight = [
    f.mileage && `Kilometerstand: ${fmtKm(f.mileage)}`,
    ps && `Leistung: ${f.power} kW (${Math.round(ps * 1.36)} PS)`,
    f.hu && `HU: ${fmtReg(f.hu)}`,
    f.emissionClass && `Schadstoffklasse: ${f.emissionClass}`,
  ].filter(Boolean);

  const equipList = f.equipment
    ? f.equipment
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    : [];

  // interleave left+right so grid fills top-to-bottom naturally
  const techAll = [];
  const maxLen = Math.max(techLeft.length, techRight.length);
  for (let i = 0; i < maxLen; i++) {
    if (techLeft[i]) techAll.push({ v: techLeft[i], col: 0 });
    if (techRight[i]) techAll.push({ v: techRight[i], col: 1 });
  }

  return (
    <div
      style={{
        width: "794px",
        height: "1123px",
        fontFamily: "Arial,sans-serif",
        background: "#fff",
        color: "#000",
        padding: "36px 42px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── DEALER HEADER ── */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          paddingBottom: "14px",
          borderBottom: "2px solid #000",
          marginBottom: "14px",
        }}
      >
        <div>
          <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "3px" }}>
            Autogalerie Jülich
          </p>
          <p style={{ fontSize: "13px", color: "#333", lineHeight: 1.75 }}>
            Alte Dürener Straße 4 · 52428 Jülich
            <br />
            +49 2461 916006613
            <br />
            info@autogalerie-juelich.de
            <br />
            www.autogalerie-juelich.de
          </p>
        </div>
        <div
          style={{
            width: "180px",
            height: "56px",
            display: "flex",
            alignItems: "center",
            justifyContent: "flex-end",
            overflow: "hidden",
          }}
        >
          <img
            src="/logo11.png"
            alt="Autogalerie Jülich"
            style={{
              width: "160px",
              height: "auto",
              objectFit: "contain",
              objectPosition: "right center",
              display: "block",
            }}
          />
        </div>
      </div>

      {/* ── CATEGORY + CONDITION ── */}
      <p
        style={{
          fontSize: "15px",
          fontWeight: 700,
          color: "#333",
          marginBottom: "4px",
        }}
      >
        {f.category} - {f.condition}
      </p>

      {/* ── MAIN TITLE ── */}
      <h1
        style={{
          fontSize: "28px",
          fontWeight: 700,
          color: "#000",
          margin: "0 0 16px 0",
          lineHeight: 1.2,
        }}
      >
        {f.title || "Fahrzeugtitel"}
      </h1>

      {/* ── IMAGE + TECH DATA ── */}
      <div
        style={{
          display: "flex",
          gap: "16px",
          marginBottom: "18px",
          background: "#f5f5f5",
          border: "1px solid #ddd",
          borderRadius: "4px",
          padding: "14px",
        }}
      >
        {hasImg && (
          <div
            style={{
              width: "210px",
              minWidth: "210px",
              height: "148px",
              borderRadius: "3px",
              overflow: "hidden",
              background: "#e0e0e0",
              flexShrink: 0,
            }}
          >
            <img
              src={f.imageDataUrl}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          </div>
        )}
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "4px 20px",
            alignContent: "start",
          }}
        >
          {techLeft.map((t, i) => (
            <p
              key={"l" + i}
              style={{ fontSize: "14px", margin: "3px 0", lineHeight: 1.4 }}
            >
              {t}
            </p>
          ))}
          {techRight.map((t, i) => (
            <p
              key={"r" + i}
              style={{ fontSize: "14px", margin: "3px 0", lineHeight: 1.4 }}
            >
              {t}
            </p>
          ))}
        </div>
      </div>

      {/* ── VERBRAUCH ── */}
      {(f.co2 || f.consumption) && (
        <div
          style={{
            marginBottom: "14px",
            paddingBottom: "14px",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <p style={{ fontWeight: 700, fontSize: "15px", marginBottom: "5px" }}>
            Verbrauch
          </p>
          <p style={{ fontSize: "13px", color: "#333", lineHeight: 1.6 }}>
            {[
              f.co2 && `CO₂-Emissionen kombiniert: ${f.co2} g/km`,
              f.consumption &&
                `Verbrauch kombiniert: ${f.consumption} l/100 km`,
            ]
              .filter(Boolean)
              .join(", ")}
          </p>
        </div>
      )}

      {/* ── AUSSTATTUNG ── */}
      <div
        style={{
          paddingBottom: "20px",
          borderBottom: "1px solid #e0e0e0",
          marginBottom: "18px",
        }}
      >
        <p style={{ fontWeight: 700, fontSize: "18px", marginBottom: "12px" }}>
          Ausstattung
        </p>
        {equipList.length > 0 ? (
          <div style={{ display: "flex", flexWrap: "wrap" }}>
            {equipList.map((item, i) => (
              <div
                key={i}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  width: "50%",
                  paddingRight: "10px",
                  paddingTop: "5px",
                  paddingBottom: "5px",
                  borderBottom: "1px dotted #ececec",
                }}
              >
                <span
                  style={{
                    width: "5px",
                    height: "5px",
                    borderRadius: "50%",
                    background: "#146c2e",
                    flexShrink: 0,
                    display: "inline-block",
                  }}
                />
                <span
                  style={{ fontSize: "16px", color: "#222", lineHeight: 1.5 }}
                >
                  {item}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p style={{ fontSize: "13px", color: "#aaa", fontStyle: "italic" }}>
            Keine Ausstattungsangaben
          </p>
        )}
      </div>

      {/* ── BESCHREIBUNG ── */}
      <div
        style={{
          flex: 1,
          paddingBottom: "20px",
          borderBottom: "1px solid #e0e0e0",
          marginBottom: "18px",
        }}
      >
        <p style={{ fontWeight: 700, fontSize: "18px", marginBottom: "12px" }}>
          Fahrzeugbeschreibung
        </p>
        {f.description ? (
          <p
            style={{
              fontSize: "16px",
              color: "#333",
              lineHeight: 2.2,
              whiteSpace: "pre-wrap",
              letterSpacing: "0.01em",
            }}
          >
            {f.description}
          </p>
        ) : (
          <p style={{ fontSize: "13px", color: "#aaa", fontStyle: "italic" }}>
            Keine Beschreibung
          </p>
        )}
      </div>

      {/* ── PRICE ── */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          {f.price ? (
            <>
              <p
                style={{
                  fontSize: "56px",
                  fontWeight: 900,
                  color: "#000",
                  letterSpacing: "-2px",
                  lineHeight: 1,
                }}
              >
                {fmtPrice(f.price)}
              </p>
              <p style={{ fontSize: "13px", color: "#555", marginTop: "5px" }}>
                {f.vatNote}
              </p>
            </>
          ) : (
            <p style={{ fontSize: "30px", fontWeight: 700, color: "#aaa" }}>
              Preis auf Anfrage
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { FileSignature, Loader2, Printer } from "lucide-react";
import { ErrorNote, Field, Modal } from "@/app/(components)/sales/ui";
import {
  fillVollmachtPdf,
  VOLLMACHT_FIELDS,
  VOLLMACHT_PAGE,
  VOLLMACHT_PREVIEW,
  VOLLMACHT_TEMPLATE,
  vollmachtDefaults,
  vollmachtLine,
} from "@/lib/zulassungsvollmacht";

const percent = (value, total) => `${(value / total) * 100}%`;

const EDITOR_FIELDS = [
  ["holderName", "Name oder Firma des Halters"],
  ["holderAddress", "Anschrift des Halters"],
  ["representativeName", "Bevollmächtigte Person oder Firma"],
  ["representativeAddress", "Anschrift der bevollmächtigten Person"],
  ["vehicle", "Fahrzeug und FIN oder Kennzeichen"],
  ["evb", "eVB-Nummer"],
  ["placeDate", "Ort / Datum"],
];

function VollmachtPreview({ values }) {
  const { width, height } = VOLLMACHT_PAGE;
  return (
    <div
      className="relative mx-auto w-full max-w-[470px] bg-white shadow-sm ring-1 ring-line md:max-w-[min(470px,calc(70.69dvh-7rem))]"
      style={{ aspectRatio: `${width} / ${height}`, containerType: "inline-size" }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={VOLLMACHT_PREVIEW} alt="Vorschau der Zulassungsvollmacht" className="absolute inset-0 h-full w-full" />
      {VOLLMACHT_FIELDS.map((field) => {
        const value = vollmachtLine(values[field.key]);
        if (!value) return null;
        const size = Math.min(12, (field.width - 10) / (value.length * 0.62));
        return (
          <span
            key={field.key}
            aria-hidden="true"
            className="absolute flex items-center overflow-hidden whitespace-nowrap font-[Arial,sans-serif] text-ink"
            style={{
              left: percent(field.x + 5, width),
              top: percent(field.top, height),
              width: percent(field.width - 10, width),
              height: percent(field.height, height),
              fontSize: `${(size / width) * 100}cqw`,
            }}
          >
            {value}
          </span>
        );
      })}
    </div>
  );
}

export default function VollmachtButton({ buyer, vehicle }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");

  function openForm() {
    setValues((current) => current ?? vollmachtDefaults(buyer, vehicle));
    setError("");
    setOpen(true);
  }

  async function openPrintPdf() {
    const viewer = window.open("", "_blank");
    if (!viewer) {
      setError("Bitte Pop-ups für diese Seite erlauben und die Druck-PDF erneut öffnen.");
      return;
    }
    viewer.opener = null;
    setPrinting(true);
    setError("");
    try {
      const response = await fetch(VOLLMACHT_TEMPLATE);
      if (!response.ok) {
        viewer.close();
        setError("Die Vorlage konnte nicht geladen werden. Bitte erneut versuchen.");
        return;
      }
      const pdf = await fillVollmachtPdf(await response.arrayBuffer(), values);
      if (viewer.closed) return;
      const url = URL.createObjectURL(new Blob([pdf], { type: "application/pdf" }));
      viewer.location.replace(url);
      window.setTimeout(() => URL.revokeObjectURL(url), 5 * 60_000);
    } catch {
      viewer.close();
      setError("Die Druck-PDF konnte nicht erstellt werden. Bitte erneut versuchen.");
    } finally {
      setPrinting(false);
    }
  }

  return (
    <>
      <button type="button" onClick={openForm} className="btn btn-secondary" title="Zulassungsvollmacht ausfüllen">
        <FileSignature /> Vollmacht
      </button>
      {open && values ? createPortal(
        <div className="dash-shell print:hidden">
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title="Zulassungsvollmacht"
            width="max-w-5xl"
            bodyClassName="max-h-[calc(100dvh-8.25rem)] overflow-y-auto px-4 py-3"
            footer={
              <button type="button" onClick={openPrintPdf} disabled={printing} className="btn btn-primary">
                {printing ? <Loader2 className="animate-spin" /> : <Printer />} PDF zum Drucken öffnen
              </button>
            }
          >
            <div className="grid items-start gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8">
              <div className="min-w-0 space-y-2.5 [@media(max-height:560px)]:space-y-1.5">
                {error ? <ErrorNote onClose={() => setError("")}>{error}</ErrorNote> : null}
                {EDITOR_FIELDS.map(([key, label]) => (
                  <Field key={key} label={label} id={`${id}-${key}`} className="[&>label]:mb-0.5 [&>label]:leading-tight">
                    <input
                      id={`${id}-${key}`}
                      className="field [@media(max-height:560px)]:h-[30px]"
                      value={values[key]}
                      onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                      autoComplete="off"
                    />
                  </Field>
                ))}
              </div>
              <VollmachtPreview values={values} />
            </div>
          </Modal>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

"use client";

import { useId, useState } from "react";
import { createPortal } from "react-dom";
import { FileSignature, Loader2, Printer } from "lucide-react";
import { ErrorNote, Field, Modal } from "@/app/(components)/sales/ui";
import { exceedsFormField, fillPrintableForm, formTextRuns } from "@/lib/printableForm";

const percent = (value, total) => `${(value / total) * 100}%`;

function FormPreview({ form, values }) {
  const { width, height } = form.page;
  return (
    <div className="min-w-0 md:sticky md:top-0">
      <div
        className="relative mx-auto w-full max-w-[470px] bg-white shadow-sm ring-1 ring-line md:max-w-[min(470px,calc(70.69dvh-7rem))]"
        style={{ aspectRatio: `${width} / ${height}`, containerType: "inline-size" }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={form.preview} alt={`Vorschau: ${form.title}`} className="absolute inset-0 h-full w-full" />
        {form.fields.flatMap((field) => formTextRuns(field, values[field.key]).map((run) => {
          const size = Math.min(run.fontSize, run.width / (run.value.length * 0.62));
          return (
            <span
              key={`${field.key}-${run.top}-${run.x}`}
              aria-hidden="true"
              className="absolute flex items-center overflow-hidden whitespace-nowrap font-[Arial,sans-serif] text-ink"
              style={{
                justifyContent: run.center ? "center" : undefined,
                left: percent(run.x, width),
                top: percent(run.top, height),
                width: percent(run.width, width),
                height: percent(run.height, height),
                fontSize: `${(size / width) * 100}cqw`,
              }}
            >
              {run.value}
            </span>
          );
        }))}
      </div>
    </div>
  );
}

export default function PrintableFormButton({ form, defaults, icon: Icon = FileSignature }) {
  const id = useId();
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(null);
  const [printing, setPrinting] = useState(false);
  const [error, setError] = useState("");
  const invalid = new Set(form.fields.filter((field) => exceedsFormField(field, values?.[field.key])).map((field) => field.key));

  function openForm() {
    setValues((current) => current ?? defaults);
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
      const response = await fetch(form.template);
      if (!response.ok) {
        viewer.close();
        setError("Die Vorlage konnte nicht geladen werden. Bitte erneut versuchen.");
        return;
      }
      const pdf = await fillPrintableForm(await response.arrayBuffer(), form.fields, values);
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
      <button type="button" onClick={openForm} className="btn btn-secondary" title={`${form.title} ausfüllen`} aria-label={form.label}>
        <Icon /> <span className="hidden sm:inline">{form.label}</span>
      </button>
      {open && values ? createPortal(
        <div className="dash-shell print:hidden">
          <Modal
            open={open}
            onClose={() => setOpen(false)}
            title={form.title}
            width="max-w-5xl"
            bodyClassName="max-h-[calc(100dvh-8.25rem)] overflow-y-auto px-4 py-3"
            footer={
              <button type="button" onClick={openPrintPdf} disabled={printing || invalid.size > 0} className="btn btn-primary">
                {printing ? <Loader2 className="animate-spin" /> : <Printer />} PDF zum Drucken öffnen
              </button>
            }
          >
            <div className="grid items-start gap-6 md:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] md:gap-8">
              <div className="grid min-w-0 grid-cols-2 gap-x-3 gap-y-2.5 [@media(max-height:560px)]:gap-y-1.5">
                {error ? <div className="col-span-2"><ErrorNote onClose={() => setError("")}>{error}</ErrorNote></div> : null}
                {form.fields.map(({ key, label, cells, half, lineTops, type = "text" }) => {
                  const inputId = `${id}-${key}`;
                  const tooLong = invalid.has(key);
                  const Input = lineTops ? "textarea" : "input";
                  return (
                    <Field key={key} label={label} id={inputId} className={`min-w-0 [&>label]:mb-0.5 [&>label]:leading-tight ${half ? "" : "col-span-2"}`}>
                      <Input
                        id={inputId}
                        type={lineTops ? undefined : type}
                        max={type === "date" ? "9999-12-31" : undefined}
                        rows={lineTops?.length}
                        className={lineTops ? "field min-w-0 resize-y" : "field min-w-0 [@media(max-height:560px)]:h-[30px]"}
                        value={values[key] ?? ""}
                        onChange={(event) => setValues((current) => ({ ...current, [key]: event.target.value }))}
                        aria-invalid={tooLong || undefined}
                        aria-describedby={tooLong ? `${inputId}-error` : undefined}
                        autoComplete="off"
                      />
                      {tooLong ? (
                        <p id={`${inputId}-error`} className="mt-1 text-[11px] text-rose-700">
                          Maximal {lineTops ? `${lineTops.length} Zeilen` : `${cells} Zeichen`} im Formular.
                        </p>
                      ) : null}
                    </Field>
                  );
                })}
              </div>
              <FormPreview form={form} values={values} />
            </div>
          </Modal>
        </div>,
        document.body,
      ) : null}
    </>
  );
}

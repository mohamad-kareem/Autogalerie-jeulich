"use client";

import { useRef, useState } from "react";
import { ImageIcon, LoaderCircle, Trash2, Upload } from "lucide-react";
import { api } from "@/app/(components)/sales/ui";
import { useCompanyStamp } from "@/app/(components)/useCompanyStamp";
import { COMPANY_STAMP_API, COMPANY_STAMP_MAX_BYTES, companyStampUrl } from "@/lib/companyStamp";

export default function CompanyStampSettings() {
  const input = useRef(null);
  const [stamp, setStamp] = useCompanyStamp();
  const [busy, setBusy] = useState("");
  const [feedback, setFeedback] = useState({ message: "", error: false });

  async function update(file) {
    const action = file ? "upload" : "remove";
    if (file?.size > COMPANY_STAMP_MAX_BYTES) {
      setFeedback({ message: "Die Bilddatei darf höchstens 3 MB groß sein.", error: true });
      return;
    }

    setBusy(action);
    setFeedback({ message: "", error: false });
    const form = file ? new FormData() : undefined;
    if (form) form.set("file", file);
    const res = await api(COMPANY_STAMP_API, { method: file ? "PUT" : "DELETE", form });
    if (res.ok) {
      setStamp({ id: res.data.id, loading: false, error: "" });
      setFeedback({ message: file ? "Firmenstempel gespeichert." : "Firmenstempel entfernt.", error: false });
    } else {
      setFeedback({ message: res.data.error || "Änderung konnte nicht gespeichert werden.", error: true });
    }
    setBusy("");
  }

  const message = feedback.message || stamp.error;
  const hasError = feedback.message ? feedback.error : Boolean(stamp.error);

  return (
    <div className="card flex flex-col gap-4 p-4 sm:flex-row sm:items-center sm:p-5">
      <div className="flex h-20 w-36 shrink-0 items-center justify-center rounded-md border border-line bg-white p-2 text-muted">
        {stamp.id ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={companyStampUrl(stamp.id)} alt="Hinterlegter Firmenstempel" className="max-h-full max-w-full" />
        ) : stamp.loading ? (
          <LoaderCircle className="size-5 motion-safe:animate-spin" aria-hidden="true" />
        ) : (
          <ImageIcon className="size-6" aria-hidden="true" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <h3 className="text-[15px] font-semibold text-ink">
          {stamp.loading ? "Firmenstempel wird geladen …" : stamp.id ? "Firmenstempel hinterlegt" : stamp.error ? "Firmenstempel" : "Kein Firmenstempel hinterlegt"}
        </h3>
        <p className="mt-1 text-[13px] text-muted">Der Stempel kann in jedem Kaufvertrag einzeln ausgewählt werden.</p>
        <p className="mt-1 text-[12px] text-muted">PNG, JPG oder WebP, maximal 3 MB.</p>
        {message ? <p role={hasError ? "alert" : "status"} className={hasError ? "mt-1 text-[12px] text-rose-700" : "mt-1 text-[12px] text-emerald-700"}>{message}</p> : null}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <input
          ref={input}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          hidden
          onChange={(event) => {
            const file = event.target.files[0];
            event.target.value = "";
            if (file) update(file);
          }}
        />
        <button type="button" className="btn btn-primary" disabled={stamp.loading || Boolean(busy)} onClick={() => input.current?.click()}>
          {busy === "upload" ? <LoaderCircle className="motion-safe:animate-spin" /> : <Upload />}
          {stamp.id ? "Stempel ersetzen" : "Stempel hochladen"}
        </button>
        {stamp.id ? (
          <button type="button" className="btn btn-secondary" disabled={Boolean(busy)} onClick={() => update()}>
            {busy === "remove" ? <LoaderCircle className="motion-safe:animate-spin" /> : <Trash2 />}
            Entfernen
          </button>
        ) : null}
      </div>
    </div>
  );
}

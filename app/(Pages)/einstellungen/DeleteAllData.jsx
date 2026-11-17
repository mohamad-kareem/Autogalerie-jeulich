"use client";

import { useState } from "react";
import { signOut } from "next-auth/react";
import { AlertTriangle, Download, LoaderCircle, Trash2 } from "lucide-react";
import { Modal } from "@/app/(components)/sales/ui";

const WORD = "LÖSCHEN";

/** Admins only: delete every entry in the database – backup first, then type LÖSCHEN. */
export default function DeleteAllData() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  function openDialog() {
    setTyped("");
    setError("");
    setOpen(true);
  }

  async function wipe() {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/admin/wipe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ confirm: typed.trim() }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || "Löschen fehlgeschlagen.");
      // the logins are gone too – back to the login page
      await signOut({ callbackUrl: "/login" });
    } catch (e) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="card border-rose-200 px-4 py-3.5 sm:px-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-tight text-ink">Alle Daten löschen</h3>
          <p className="mt-1 text-[13px] leading-snug text-muted">
            Löscht alles in der Datenbank – Fahrzeuge, Verträge, Kunden, Anfragen, Analysen und alle Benutzerkonten. Das kann nicht rückgängig gemacht werden.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <a href="/api/admin/backup" download className="btn btn-secondary flex-1 justify-center sm:flex-none">
            <Download /> Backup herunterladen
          </a>
          <button type="button" onClick={openDialog} className="btn flex-1 justify-center bg-rose-600 text-white hover:bg-rose-700 sm:flex-none">
            <Trash2 /> Alles löschen …
          </button>
        </div>
      </div>

      <Modal
        open={open}
        onClose={() => !busy && setOpen(false)}
        title="Alle Daten löschen"
        footer={
          <>
            <button type="button" className="btn btn-secondary" onClick={() => setOpen(false)} disabled={busy}>
              Abbrechen
            </button>
            <button
              type="button"
              className="btn bg-rose-600 text-white hover:bg-rose-700"
              onClick={wipe}
              disabled={busy || typed.trim() !== WORD}
            >
              {busy ? <LoaderCircle className="animate-spin" /> : <Trash2 />} Endgültig löschen
            </button>
          </>
        }
      >
        <div className="space-y-3 text-[13px]">
          <p className="flex items-start gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-rose-800">
            <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
            <span>Alle Einträge in der Datenbank werden gelöscht, auch alle Benutzerkonten – danach kann sich niemand mehr anmelden. Das kann nicht rückgängig gemacht werden.</span>
          </p>

          <div className="rounded-md border border-line px-3 py-2.5">
            <p className="font-medium text-ink">Vorher sichern</p>
            <p className="mt-0.5 text-muted">Lädt alle Daten als Datei herunter, damit sie bei Bedarf zurückgespielt werden können.</p>
            <a href="/api/admin/backup" download className="btn btn-secondary btn-sm mt-2">
              <Download /> Backup herunterladen
            </a>
          </div>

          <div>
            <label htmlFor="wipe-confirm" className="mb-1 block text-[12px] text-muted">
              Zur Bestätigung <strong className="text-ink">{WORD}</strong> eingeben
            </label>
            <input
              id="wipe-confirm"
              className="field"
              value={typed}
              onChange={(e) => setTyped(e.target.value)}
              autoComplete="off"
              spellCheck={false}
              disabled={busy}
            />
          </div>
          {error ? <p className="text-[12.5px] font-medium text-rose-700">{error}</p> : null}
        </div>
      </Modal>
    </div>
  );
}

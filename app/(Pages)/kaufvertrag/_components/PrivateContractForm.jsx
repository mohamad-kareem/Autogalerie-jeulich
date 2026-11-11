"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Save } from "lucide-react";
import { FiMenu } from "react-icons/fi";
import { useSidebar } from "@/app/(components)/SidebarContext";
import { ErrorNote, api } from "@/app/(components)/sales/ui";
import Fahrzeugakte, { tuevOf } from "../form/Fahrzeugakte";
import { isPhone, phoneChars } from "@/lib/sales";
import PrivateDocumentOptions from "./PrivateDocumentOptions";
import PrivateSheet, { CHECKS, FIELDS } from "./PrivateSheet";

const normVin = (v) => String(v || "").replace(/\s+/g, "").toUpperCase();

/** Privater Kaufvertrag – the TÜV-SÜD form, filled in on screen. New contract or "Bearbeiten" (like the normal Kaufvertrag). */
export default function PrivateContractForm({ initial, contractId = "", carId = "", websiteCar = null }) {
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const [d, setD] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const editing = Boolean(contractId);

  const setField = (key, raw) => {
    const [g, k] = FIELDS[key];
    const val = key === "sellerPhone" || key === "buyerPhone" ? phoneChars(raw) : raw;
    setD((x) => {
      const next = g ? { ...x, [g]: { ...x[g], [k]: val } } : { ...x, [k]: val };
      // typing into the damages / engine km box ticks its check box
      if (key === "damagesText" && val.trim()) next.guarantees = { ...next.guarantees, onlyDamages: true };
      if (key === "engineKm" && val.trim()) next.guarantees = { ...next.guarantees, engineKmCheck: true };
      return next;
    });
  };
  const toggle = (key) => {
    const [g] = CHECKS[key];
    setD((x) => ({ ...x, [g]: { ...x[g], [key]: !x[g][key] } }));
  };
  // the car's entry in the Fahrzeugverwaltung, found by FIN
  const [akte, setAkte] = useState({ status: "empty", schein: null, fin: "" });
  const appliedFor = useRef("");
  const vinNow = normVin(d.car.vin);
  useEffect(() => {
    const fin = vinNow;
    if (fin.length < 10) {
      const t = setTimeout(() => setAkte({ status: fin ? "short" : "empty", schein: null, fin }), 0);
      return () => clearTimeout(t);
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setAkte((prev) => ({ status: "loading", schein: prev.fin === fin ? prev.schein : null, fin }));
      try {
        const res = await fetch(`/api/carschein?finNumber=${encodeURIComponent(fin)}&limit=1`, { cache: "no-store", signal: controller.signal });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const found = Array.isArray(data.docs) ? data.docs[0] : null;
        setAkte({ status: found ? "found" : "missing", schein: found || null, fin });
      } catch (e) {
        if (e.name !== "AbortError") setAkte({ status: "error", schein: null, fin });
      }
    }, 350);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [vinNow]);

  // car data from the Fahrzeugakte when the boxes are still empty
  useEffect(() => {
    const v = akte.schein;
    if (!v?._id || appliedFor.current === v._id) return;
    appliedFor.current = v._id;
    const t = setTimeout(
      () =>
        setD((x) => {
          const name = String(v.carName || "").trim();
          const maker = name.split(/\s+/)[0] || "";
          const fill = (cur, val) => (String(cur || "").trim() ? cur : val == null ? "" : String(val));
          const hu = tuevOf(v, websiteCar)?.value || "";
          return {
            ...x,
            car: {
              ...x.car,
              maker: fill(x.car.maker, maker),
              type: fill(x.car.type, name.slice(maker.length).trim()),
              vin: fill(x.car.vin, v.finNumber),
              nextHu: fill(x.car.nextHu, /^\d{2}\/\d{4}$/.test(hu) ? hu : ""),
              owners: fill(x.car.owners, v.vorbesitzer),
            },
          };
        }),
      0,
    );
    return () => clearTimeout(t);
  }, [akte.schein, websiteCar]);

  /** save → the contract page (PDF, Drucken, E-Mail, Zahlung) – like the normal Kaufvertrag */
  async function save() {
    setErr("");
    const phones = [d.seller.phone, d.buyer.phone].filter((p) => String(p || "").trim());
    if (phones.some((p) => !isPhone(p))) {
      setErr("Die Telefonnummer darf nur Zahlen, Leerzeichen, „/“ und „-“ enthalten.");
      return;
    }
    setBusy(true);
    const res = editing
      ? await api(`/api/privatvertraege/${contractId}`, { method: "PATCH", body: { data: d } })
      : await api("/api/privatvertraege", { method: "POST", body: { data: d, carId } });
    if (!res.ok) {
      setBusy(false);
      setErr(res.data.error || "Vertrag konnte nicht gespeichert werden.");
      return;
    }
    router.push(`/kaufvertrag/privat/${editing ? contractId : res.data.contract._id}`);
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-[1280px]">
      {/* Action bar – like the Kaufvertrag */}
      <div className="sticky top-14 z-20 -mt-6 mb-4 lg:top-0 flex flex-wrap items-center gap-2 px-4 py-2.5 ind-stickybar rounded-b-[4px] border-x border-[#a9b0b9]">
        <button type="button" onClick={openSidebar} className="ind-icon-btn md:hidden" aria-label="Menü öffnen">
          <FiMenu className="h-4 w-4" />
        </button>
        <h1 className="min-w-0 truncate text-[15px] font-semibold text-ink">{editing ? "Privatvertrag bearbeiten" : "Neuer Kaufvertrag"}</h1>
        {!editing ? (
          <div className="ind-seg ml-2 inline-flex">
            <Link
              href={`/kaufvertrag/form${carId ? `?carId=${encodeURIComponent(carId)}` : ""}`}
              className="ind-seg-btn"
              title="Kaufvertrag vom Händler"
            >
              Händler
            </Link>
            <span className="ind-seg-btn ind-seg-on">Privat</span>
          </div>
        ) : null}
        <span className="mr-auto" />
        <button type="button" onClick={save} disabled={busy} className="btn btn-primary">
          {busy ? <Loader2 className="animate-spin" /> : <Save />} {editing ? "Änderungen speichern" : "Speichern"}
        </button>
      </div>

      {err ? (
        <div className="mb-3">
          <ErrorNote onClose={() => setErr("")}>{err}</ErrorNote>
        </div>
      ) : null}

      <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_330px]">
        {/* ----------------------------- the TÜV-SÜD form ----------------------------- */}
        <div className="overflow-x-auto">
          <PrivateSheet d={d} setField={setField} toggle={toggle} />
        </div>

        {/* ----------------------------- Side panel ----------------------------- */}
        <aside className="space-y-3 lg:sticky lg:top-[4.25rem]">
          <Fahrzeugakte
            status={akte.status}
            schein={akte.schein}
            websiteCar={websiteCar}
            onSaved={(updated) => setAkte((prev) => (prev.schein?._id === updated?._id ? { ...prev, schein: updated } : prev))}
          />
          <PrivateDocumentOptions
            value={d.documentOptions}
            onChange={(documentOptions) => setD((current) => ({ ...current, documentOptions }))}
            disabled={busy}
          />
        </aside>
      </div>
    </div>
  );
}

"use client";

/**
 * Fahrzeugverwaltung — every vehicle in stock: registration document, keys,
 * phase (Werkstatt → Verkauft), warranty and claims.
 *
 * The page keeps the list; each dialog lives in _components/ and talks to
 * /api/carschein through _components/api.js.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { FiMenu, FiPlus, FiSearch, FiX } from "react-icons/fi";

import { useSidebar } from "@/app/(components)/SidebarContext";
import PageLoader from "@/app/(components)/helpers/PageLoader";

import { deleteSchein, fetchScheins } from "./_components/api";
import { LIST_LIMIT, STAGES, normalizeStage } from "./_components/constants";
import DetailsModal from "./_components/DetailsModal";
import ImagePreviewModal from "./_components/ImagePreviewModal";
import KeyModal from "./_components/KeyModal";
import { printSchein } from "./_components/printSchein";
import StageModal from "./_components/StageModal";
import VehicleFormModal from "./_components/VehicleFormModal";
import VehicleList from "./_components/VehicleList";
import WarrantyModal from "./_components/WarrantyModal";
import { theme } from "./_components/ui";

function useDarkMode() {
  const [dark, setDark] = useState(false);
  useEffect(() => {
    const read = () => {
      try {
        const saved = localStorage.getItem("theme");
        setDark(saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches));
      } catch {
        setDark(document.documentElement.classList.contains("dark"));
      }
    };
    read();
    // Follows a theme change made in the settings.
    const observer = new MutationObserver(() => setDark(document.documentElement.classList.contains("dark")));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return dark;
}

export default function FahrzeugverwaltungPage() {
  const { status } = useSession();
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const dark = useDarkMode();
  const t = theme(dark);

  const [scheins, setScheins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [stage, setStage] = useState("ALL");
  // One dialog at a time: { type, schein }.
  const [dialog, setDialog] = useState(null);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    let cancelled = false;
    fetchScheins(LIST_LIMIT)
      .then((docs) => !cancelled && setScheins(docs))
      .catch(() => toast.error("Fahrzeuge konnten nicht geladen werden"))
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  /* ---------------------------------------------------------- list updates */

  const replace = useCallback((doc) => {
    if (!doc?._id) return;
    setScheins((list) => list.map((entry) => (entry._id === doc._id ? doc : entry)));
    // Open dialogs show the fresh data too.
    setDialog((current) => (current?.schein?._id === doc._id ? { ...current, schein: doc } : current));
  }, []);

  // A dialog opened from the details goes back to the details when it closes.
  const closeDialog = useCallback(() => {
    setDialog((current) => (current?.back ? { type: current.back, schein: current.schein } : null));
  }, []);

  const savedAndClose = useCallback((doc) => {
    replace(doc);
    setDialog((current) => (current?.back ? { type: current.back, schein: doc } : null));
  }, [replace]);

  const openFromDetails = useCallback((type) => {
    const schein = dialog?.schein;
    if (!schein) return;
    if (type === "print") return void printSchein(schein);
    if (type === "image" && !schein.imageUrl) return void toast.error("Kein Bild für dieses Fahrzeug.");
    setDialog({ type, schein, back: "details" });
  }, [dialog]);

  const created = useCallback((doc) => {
    setScheins((list) => [doc, ...list]);
    setDialog(null);
  }, []);

  const remove = useCallback(async (schein) => {
    if (!window.confirm(`„${schein.carName || "Fahrzeug"}“ wirklich löschen?`)) return;
    try {
      await deleteSchein(schein._id);
      setScheins((list) => list.filter((entry) => entry._id !== schein._id));
      toast.success("Fahrzeug gelöscht");
    } catch (error) {
      toast.error(error.message || "Löschen fehlgeschlagen");
    }
  }, []);

  const onAction = useCallback((type, schein) => {
    if (type === "print") return void printSchein(schein);
    if (type === "delete") return void remove(schein);
    if (type === "image" && !schein.imageUrl) return void toast.error("Kein Bild für dieses Fahrzeug.");
    setDialog({ type, schein });
    return undefined;
  }, [remove]);

  /* ---------------------------------------------------------- filters */

  const stageCounts = useMemo(() => {
    const counts = {};
    for (const schein of scheins) {
      const id = normalizeStage(schein.stage);
      counts[id] = (counts[id] || 0) + 1;
    }
    return counts;
  }, [scheins]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return scheins.filter((schein) => {
      if (term && ![schein.carName, schein.finNumber].some((field) => String(field || "").toLowerCase().includes(term))) return false;
      if (stage !== "ALL" && normalizeStage(schein.stage) !== stage) return false;
      return true;
    });
  }, [scheins, query, stage]);

  if (status === "loading") return <PageLoader />;

  const tabs = [{ id: "ALL", label: "Alle", count: scheins.length }, ...STAGES.map((entry) => ({ id: entry.id, label: entry.label, count: stageCounts[entry.id] || 0 }))];

  return (
    <main className={`min-h-screen ${t.page}`}>
      <div className="mx-auto max-w-screen-2xl px-3 py-4 sm:px-6 sm:py-6">
        {/* header */}
        <header className="mb-5 flex items-center gap-3">
          <button type="button" onClick={openSidebar} aria-label="Menü öffnen" className={`rounded-lg p-2 md:hidden ${t.ghost}`}>
            <FiMenu className="size-5" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-semibold tracking-tight">Fahrzeugverwaltung</h1>
            <p className={`mt-0.5 text-[13px] ${t.muted}`}>Fahrzeugscheine, Schlüssel, Phasen und Garantie</p>
          </div>
          <button
            type="button"
            onClick={() => setDialog({ type: "create", schein: null })}
            className={`inline-flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold shadow-sm transition sm:px-4 ${t.primary}`}
          >
            <FiPlus className="size-4" />
            <span className="hidden sm:inline">Fahrzeug hinzufügen</span>
            <span className="sm:hidden">Neu</span>
          </button>
        </header>

        <section className={`overflow-hidden rounded-xl border shadow-sm ${t.card}`}>
          {/* phase tabs */}
          <nav aria-label="Phasen" className={`scrollbar-hide flex gap-1 overflow-x-auto border-b px-3 sm:px-4 ${t.divider}`}>
            {tabs.map((tab) => {
              const active = stage === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setStage(tab.id)}
                  aria-current={active ? "true" : undefined}
                  className={`relative flex h-11 shrink-0 items-center gap-2 px-2.5 text-[13px] font-medium transition ${
                    active ? t.title : dark ? "text-slate-400 hover:text-slate-200" : "text-slate-500 hover:text-slate-800"
                  }`}
                >
                  {tab.label}
                  <span
                    className={`rounded-full px-1.5 text-[11px] tabular-nums ${
                      active ? (dark ? "bg-emerald-500/15 text-emerald-300" : "bg-emerald-50 text-emerald-700") : dark ? "bg-slate-800 text-slate-400" : "bg-slate-100 text-slate-500"
                    }`}
                  >
                    {tab.count}
                  </span>
                  {active ? <span className="absolute inset-x-1.5 bottom-0 h-0.5 rounded-full bg-emerald-500" /> : null}
                </button>
              );
            })}
          </nav>

          {/* toolbar */}
          <div className={`flex items-center gap-3 border-b px-3 py-2.5 sm:px-4 ${t.divider}`}>
            <label className={`flex h-9 w-full items-center gap-2 rounded-lg border px-3 sm:max-w-xs ${t.input}`}>
              <FiSearch className={`size-4 shrink-0 ${t.faint}`} />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Fahrzeug oder FIN suchen …"
                aria-label="Fahrzeug oder FIN suchen"
                className="min-w-0 flex-1 bg-transparent text-[13px] outline-none"
              />
              {query ? (
                <button type="button" onClick={() => setQuery("")} aria-label="Suche leeren" className={`rounded p-0.5 ${t.ghost}`}>
                  <FiX className="size-4" />
                </button>
              ) : null}
            </label>
            <span className={`ml-auto hidden shrink-0 text-[13px] tabular-nums sm:inline ${t.muted}`}>
              {loading ? "Lädt …" : `${filtered.length} von ${scheins.length} Fahrzeugen`}
            </span>
          </div>

          <VehicleList scheins={filtered} loading={loading} dark={dark} onAction={onAction} resetKey={`${query}|${stage}`} />
        </section>
      </div>

      {/* dialogs */}
      <VehicleFormModal
        open={dialog?.type === "create" || dialog?.type === "edit"}
        schein={dialog?.type === "edit" ? dialog.schein : null}
        dark={dark}
        onClose={closeDialog}
        onSaved={dialog?.type === "edit" ? savedAndClose : created}
      />
      <DetailsModal
        open={dialog?.type === "details"}
        schein={dialog?.schein}
        dark={dark}
        onClose={closeDialog}
        onEdit={() => openFromDetails("edit")}
        onAction={openFromDetails}
        onSaved={replace}
      />
      <KeyModal open={dialog?.type === "key"} schein={dialog?.schein} dark={dark} onClose={closeDialog} onSaved={savedAndClose} />
      <StageModal open={dialog?.type === "stage"} schein={dialog?.schein} dark={dark} onClose={closeDialog} onSaved={savedAndClose} />
      <WarrantyModal open={dialog?.type === "warranty"} schein={dialog?.schein} dark={dark} onClose={closeDialog} onSaved={savedAndClose} />
      <ImagePreviewModal
        open={dialog?.type === "image"}
        schein={dialog?.schein}
        onClose={closeDialog}
        onPrint={() => dialog?.schein && printSchein(dialog.schein)}
      />
    </main>
  );
}

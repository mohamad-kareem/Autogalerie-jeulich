"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import { FiImage, FiMapPin, FiPackage, FiPlus, FiSearch, FiTrash2, FiUpload, FiX } from "react-icons/fi";
import { useSidebar } from "@/app/(components)/SidebarContext";

const EMPTY = { name: "", category: "", quantity: "1", location: "", condition: "", purchasePrice: "", supplier: "", description: "", imageUrl: "" };
const euro = new Intl.NumberFormat("de-DE", { style: "currency", currency: "EUR" });

function Field({ label, children, className = "" }) {
  return <label className={`grid gap-1.5 text-xs font-medium text-slate-600 ${className}`}><span>{label}</span>{children}</label>;
}

function InventoryDialog({ item, onClose, onSaved }) {
  const [form, setForm] = useState(item ? { ...EMPTY, ...item, quantity: String(item.quantity), purchasePrice: item.purchasePrice ?? "" } : EMPTY);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [photo, setPhoto] = useState(null);

  const set = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const uploadPhoto = async (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) return toast.error("Bitte eine Bilddatei auswählen");
    if (file.size > 10 * 1024 * 1024) return toast.error("Das Bild darf höchstens 10 MB groß sein");
    setPhoto(URL.createObjectURL(file));
    setUploading(true);
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("folder", "inventory");
      const response = await fetch("/api/upload", { method: "POST", body: data });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Bild-Upload fehlgeschlagen");
      set("imageUrl", result.url);
    } catch (error) {
      setPhoto(null);
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  const save = async (event) => {
    event.preventDefault();
    setSaving(true);
    try {
      const payload = { ...form, quantity: Number(form.quantity), purchasePrice: form.purchasePrice === "" ? null : Number(form.purchasePrice) };
      const response = await fetch(item?._id ? `/api/inventory/${item._id}` : "/api/inventory", {
        method: item?._id ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Speichern fehlgeschlagen");
      onSaved(result);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const image = photo || form.imageUrl;
  return (
    <div className="fixed inset-0 z-[80] grid place-items-center bg-slate-950/40 p-3 backdrop-blur-[2px]" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form onSubmit={save} className="flex max-h-[94vh] w-full max-w-2xl flex-col overflow-hidden rounded-lg border border-slate-200 bg-white shadow-2xl">
        <header className="flex items-center gap-3 border-b border-slate-200 px-4 py-3">
          <span className="grid size-9 place-items-center rounded-md bg-emerald-50 text-emerald-700"><FiPackage size={18} /></span>
          <div className="min-w-0 flex-1"><h2 className="text-sm font-semibold text-slate-900">{item ? "Artikel bearbeiten" : "Artikel hinzufügen"}</h2><p className="text-xs text-slate-500">Lagerartikel und Bestandsdetails</p></div>
          <button type="button" onClick={onClose} aria-label="Schließen" className="grid size-8 place-items-center rounded-md text-slate-500 hover:bg-slate-100"><FiX size={17} /></button>
        </header>
        <div className="grid gap-4 overflow-y-auto p-4 sm:grid-cols-[150px_1fr]">
          <div>
            <label className="group relative flex aspect-square cursor-pointer items-center justify-center overflow-hidden rounded-md border border-dashed border-slate-300 bg-slate-50 text-slate-500 hover:border-emerald-500">
              {image ? <img src={image} alt="Artikel" className="size-full object-cover" /> : <span className="grid justify-items-center gap-2"><FiImage size={23} /><span className="text-[11px]">Foto hinzufügen</span></span>}
              <span className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 bg-slate-950/65 py-2 text-[11px] font-medium text-white"><FiUpload size={13} />{uploading ? "Lädt …" : "Bild auswählen"}</span>
              <input type="file" accept="image/*" className="sr-only" onChange={(event) => uploadPhoto(event.target.files?.[0])} />
            </label>
            {image ? <button type="button" onClick={() => { setPhoto(null); set("imageUrl", ""); }} className="mt-2 inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-red-600"><FiTrash2 size={12} />Bild entfernen</button> : null}
          </div>
          <div className="grid content-start grid-cols-2 gap-3">
            <Field label="Artikelname *" className="col-span-2"><input required maxLength={120} value={form.name} onChange={(e) => set("name", e.target.value)} placeholder="z. B. Winterreifen Michelin" className="h-9 rounded-md border border-slate-300 px-2.5 text-sm outline-none focus:border-emerald-600" /></Field>
            <Field label="Kategorie *"><input required maxLength={60} value={form.category} onChange={(e) => set("category", e.target.value)} placeholder="z. B. Reifen, Werkzeug …" className="h-9 rounded-md border border-slate-300 px-2.5 text-sm outline-none focus:border-emerald-600" /></Field>
            <Field label="Menge"><input required min="0" type="number" value={form.quantity} onChange={(e) => set("quantity", e.target.value)} className="h-9 rounded-md border border-slate-300 px-2.5 text-sm outline-none focus:border-emerald-600" /></Field>
            <Field label="Lagerort"><input maxLength={120} value={form.location} onChange={(e) => set("location", e.target.value)} placeholder="z. B. Regal A2" className="h-9 rounded-md border border-slate-300 px-2.5 text-sm outline-none focus:border-emerald-600" /></Field>
            <Field label="Zustand"><input maxLength={60} value={form.condition} onChange={(e) => set("condition", e.target.value)} placeholder="Neu, gebraucht …" className="h-9 rounded-md border border-slate-300 px-2.5 text-sm outline-none focus:border-emerald-600" /></Field>
            <Field label="Einkaufspreis (€)"><input min="0" step="0.01" type="number" value={form.purchasePrice} onChange={(e) => set("purchasePrice", e.target.value)} placeholder="0,00" className="h-9 rounded-md border border-slate-300 px-2.5 text-sm outline-none focus:border-emerald-600" /></Field>
            <Field label="Lieferant"><input maxLength={120} value={form.supplier} onChange={(e) => set("supplier", e.target.value)} className="h-9 rounded-md border border-slate-300 px-2.5 text-sm outline-none focus:border-emerald-600" /></Field>
            <Field label="Beschreibung" className="col-span-2"><textarea maxLength={2000} rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} className="resize-y rounded-md border border-slate-300 px-2.5 py-2 text-sm outline-none focus:border-emerald-600" /></Field>
          </div>
        </div>
        <footer className="flex justify-end gap-2 border-t border-slate-200 bg-slate-50 px-4 py-3">
          <button type="button" onClick={onClose} className="h-9 rounded-md px-3 text-sm font-medium text-slate-600 hover:bg-slate-200">Abbrechen</button>
          <button type="submit" disabled={saving || uploading} className="h-9 rounded-md bg-emerald-700 px-4 text-sm font-semibold text-white hover:bg-emerald-800 disabled:opacity-50">{saving ? "Speichert …" : "Speichern"}</button>
        </footer>
      </form>
    </div>
  );
}

export default function LagerbestandPage() {
  const { status } = useSession();
  const router = useRouter();
  const { openSidebar } = useSidebar();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Alle Kategorien");
  const [dialog, setDialog] = useState(null);
  const [preview, setPreview] = useState(null);

  const load = useCallback(async () => {
    try {
      const response = await fetch("/api/inventory", { cache: "no-store" });
      if (response.status === 401) return router.push("/login");
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setItems(data);
    } catch (error) {
      toast.error(error.message || "Lagerbestand konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => { if (status === "unauthenticated") router.push("/login"); }, [status, router]);
  useEffect(() => { if (status === "authenticated") load(); }, [status, load]);

  const categories = useMemo(() => [...new Set(items.map((item) => item.category).filter(Boolean))].sort((a, b) => a.localeCompare(b, "de")), [items]);
  const filtered = useMemo(() => {
    const term = query.trim().toLocaleLowerCase("de");
    return items.filter((item) => (category === "Alle Kategorien" || item.category === category) && (!term || [item.name, item.category, item.location, item.supplier, item.description].some((value) => String(value || "").toLocaleLowerCase("de").includes(term))));
  }, [items, query, category]);
  const saved = (item) => {
    setItems((current) => item._id && current.some((entry) => entry._id === item._id) ? current.map((entry) => entry._id === item._id ? item : entry) : [item, ...current]);
    setDialog(null);
    toast.success("Artikel gespeichert");
  };
  const remove = async (item) => {
    if (!window.confirm(`„${item.name}“ wirklich löschen?`)) return;
    try {
      const response = await fetch(`/api/inventory/${item._id}`, { method: "DELETE" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      setItems((current) => current.filter((entry) => entry._id !== item._id));
      toast.success("Artikel gelöscht");
    } catch (error) { toast.error(error.message || "Löschen fehlgeschlagen"); }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      <div className="mx-auto max-w-screen-2xl px-3 py-4 sm:px-6 sm:py-6">
        <header className="mb-5 flex items-center gap-3">
          <button type="button" onClick={openSidebar} aria-label="Menü öffnen" className="grid size-9 place-items-center rounded-md border border-slate-200 bg-white text-slate-600 md:hidden"><FiPackage size={17} /></button>
          <div className="min-w-0 flex-1"><h1 className="text-xl font-semibold">Lagerbestand</h1><p className="mt-0.5 text-[13px] text-slate-500">Artikel, Mengen und Lagerorte verwalten</p></div>
          <button type="button" onClick={() => setDialog({})} className="inline-flex h-9 items-center gap-2 rounded-md bg-emerald-700 px-3 text-[13px] font-semibold text-white hover:bg-emerald-800"><FiPlus size={16} /><span className="hidden sm:inline">Artikel hinzufügen</span><span className="sm:hidden">Hinzufügen</span></button>
        </header>

        <section className="overflow-hidden rounded-md border border-slate-200 bg-white">
          <div className="flex flex-col gap-2 border-b border-slate-200 p-3 sm:flex-row sm:items-center">
            <label className="flex h-9 min-w-0 flex-1 items-center gap-2 rounded-md border border-slate-300 px-2.5 sm:max-w-sm"><FiSearch className="shrink-0 text-slate-400" size={15} /><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Artikel, Lagerort oder Lieferant suchen" className="min-w-0 flex-1 bg-transparent text-[13px] outline-none" />{query ? <button type="button" aria-label="Suche leeren" onClick={() => setQuery("")} className="text-slate-400"><FiX size={15} /></button> : null}</label>
            <select value={category} onChange={(event) => setCategory(event.target.value)} aria-label="Kategorie filtern" className="h-9 rounded-md border border-slate-300 bg-white px-2.5 text-[13px] text-slate-700 sm:w-48"><option>Alle Kategorien</option>{categories.map((entry) => <option key={entry}>{entry}</option>)}</select>
            <span className="text-xs text-slate-500 sm:ml-auto">{filtered.length} Artikel</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] table-fixed text-left">
              <colgroup><col className="w-[23%]" /><col className="w-[15%]" /><col className="w-[8%]" /><col className="w-[18%]" /><col className="w-[12%]" /><col className="w-[18%]" /><col className="w-[6%]" /></colgroup>
              <thead className="bg-slate-50 text-[10px] font-semibold uppercase text-slate-500"><tr><th className="px-4 py-2.5">Artikel</th><th className="px-4 py-2.5">Kategorie</th><th className="px-4 py-2.5 text-center">Menge</th><th className="px-4 py-2.5">Lagerort</th><th className="px-4 py-2.5">Zustand</th><th className="px-4 py-2.5 text-right">Preis / Stk.</th><th className="w-20 px-3 py-2.5" /></tr></thead>
              <tbody className="divide-y divide-slate-100 text-[13px]">
                {loading ? <tr><td colSpan={7} className="px-3 py-12 text-center text-slate-500">Lagerbestand wird geladen …</td></tr> : filtered.length === 0 ? <tr><td colSpan={7} className="px-3 py-14 text-center"><div className="mx-auto grid max-w-xs justify-items-center gap-2 text-slate-500"><span className="grid size-10 place-items-center rounded-full bg-slate-100"><FiPackage size={19} /></span><p className="text-sm font-medium text-slate-700">{items.length ? "Keine passenden Artikel" : "Noch keine Artikel erfasst"}</p><p className="text-xs">{items.length ? "Passe Suche oder Kategorie an." : "Füge Werkzeuge, Ersatzteile, Reifen oder andere Lagerartikel hinzu."}</p>{!items.length ? <button onClick={() => setDialog({})} className="mt-1 text-xs font-semibold text-emerald-700 hover:underline">Ersten Artikel hinzufügen</button> : null}</div></td></tr> : filtered.map((item) => <tr key={item._id} onClick={() => setDialog(item)} className="cursor-pointer hover:bg-slate-50/80"><td className="px-4 py-2.5"><div className="flex items-center gap-2.5"><button type="button" title={item.imageUrl ? "Bild groß anzeigen" : "Kein Bild vorhanden"} aria-label={`${item.name}: Bild groß anzeigen`} disabled={!item.imageUrl} onClick={(event) => { event.stopPropagation(); setPreview(item); }} className="group relative size-10 shrink-0 overflow-hidden rounded border border-slate-200 bg-slate-100 disabled:cursor-default">{item.imageUrl ? <><img src={item.imageUrl} alt="" className="size-full object-cover" /><span className="absolute inset-0 grid place-items-center bg-slate-950/0 text-white opacity-0 transition group-hover:bg-slate-950/40 group-hover:opacity-100"><FiImage size={16} /></span></> : <span className="grid size-full place-items-center text-slate-400"><FiImage size={16} /></span>}</button><div className="min-w-0"><p className="max-w-[240px] truncate font-medium text-slate-800">{item.name}</p>{item.supplier ? <p className="max-w-[240px] truncate text-[11px] text-slate-500">{item.supplier}</p> : null}</div></div></td><td className="px-4 py-2.5"><span className="rounded bg-slate-100 px-2 py-1 text-[11px] text-slate-600">{item.category}</span></td><td className="px-4 py-2.5 text-center"><span className="font-semibold tabular-nums text-slate-800">{item.quantity}</span></td><td className="px-4 py-2.5 text-slate-600">{item.location ? <span className="inline-flex items-center gap-1"><FiMapPin size={12} />{item.location}</span> : "–"}</td><td className="px-4 py-2.5 text-slate-600">{item.condition || "–"}</td><td className="px-4 py-2.5 text-right tabular-nums text-slate-700">{item.purchasePrice != null ? euro.format(item.purchasePrice) : "–"}</td><td className="px-3 py-2.5 text-right"><button type="button" title="Artikel löschen" aria-label={`${item.name} löschen`} onClick={(event) => { event.stopPropagation(); remove(item); }} className="grid size-8 place-items-center rounded text-slate-400 hover:bg-red-50 hover:text-red-600"><FiTrash2 size={14} /></button></td></tr>)}
              </tbody>
            </table>
          </div>
        </section>
      </div>
      {dialog ? <InventoryDialog item={dialog._id ? dialog : null} onClose={() => setDialog(null)} onSaved={saved} /> : null}
      {preview ? <div role="dialog" aria-modal="true" aria-label={`${preview.name} Bildvorschau`} className="fixed inset-0 z-[90] grid place-items-center bg-slate-950/85 p-4" onMouseDown={(event) => event.target === event.currentTarget && setPreview(null)} onKeyDown={(event) => event.key === "Escape" && setPreview(null)}><button type="button" autoFocus onClick={() => setPreview(null)} aria-label="Bild schließen" className="absolute right-4 top-4 grid size-10 place-items-center rounded-md bg-white/10 text-white hover:bg-white/20"><FiX size={21} /></button><figure className="grid max-h-full max-w-full justify-items-center gap-3"><img src={preview.imageUrl} alt={preview.name} className="max-h-[82vh] max-w-[90vw] rounded-md object-contain" /><figcaption className="text-sm text-white">{preview.name}</figcaption></figure></div> : null}
    </main>
  );
}

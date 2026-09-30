"use client";

/**
 * Fotostudio — car photos into a professional showroom.
 *
 * 1. Upload photos (several at once).
 * 2. Each car is cut out by remove.bg (car model, windows see-through).
 * 3. The car is placed in the chosen scene with realistic floor shadows and,
 *    on polished floors, a reflection. The car itself stays unchanged.
 * 4. Adjust size/position (drag the car in the preview), then download.
 *
 * Only the cut-out costs remove.bg credits; changing the scene, format or
 * position is done in the browser and is free.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import { FiDownload, FiImage, FiRefreshCw, FiTrash2, FiUpload, FiX } from "react-icons/fi";

import { CUSTOM_SCENE, FORMATS, SCENES, compose, loadImage, sceneThumb, shrinkForUpload, trimCutout } from "./_lib/studio";

const MAX_PHOTOS = 30;
const PARALLEL = 2;
const DEFAULT_PLACE = { scale: 1, offsetX: 0, offsetY: 0 };
const DEFAULT_LOOK = { shadow: 1, reflection: 1, harmonize: true };

const STATUS = {
  queued: { label: "Wartet", tone: "text-slate-500" },
  working: { label: "Wird freigestellt …", tone: "text-slate-700" },
  done: { label: "Fertig", tone: "text-emerald-700" },
  error: { label: "Fehler", tone: "text-red-700" },
};

/* ------------------------------------------------------------ small parts */

function Section({ title, aside, children }) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-2 border-b border-slate-200 pb-1.5">
        <h2 className="text-[11px] font-semibold uppercase tracking-[0.08em] text-slate-500">{title}</h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

function Slider({ label, value, min, max, step = 0.01, onChange, format }) {
  return (
    <label className="block">
      <span className="mb-1 flex items-center justify-between text-[12px] text-slate-600">
        {label}
        <span className="tabular-nums text-slate-500">{format(value)}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-slate-700"
      />
    </label>
  );
}

function Button({ primary, className = "", children, ...rest }) {
  return (
    <button
      type="button"
      className={`inline-flex h-9 items-center justify-center gap-1.5 rounded border px-3.5 text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50 ${
        primary ? "border-emerald-700 bg-emerald-700 text-white hover:bg-emerald-800" : "border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
      } ${className}`}
      {...rest}
    >
      {children}
    </button>
  );
}

const percent = (value) => `${Math.round(value * 100)} %`;

function downloadBlob(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}

/* ------------------------------------------------------------ page */

export default function FotostudioPage() {
  const { status: authStatus } = useSession();
  const router = useRouter();

  const [photos, setPhotos] = useState([]);
  const [selectedId, setSelectedId] = useState(null);
  const [sceneId, setSceneId] = useState(SCENES[0].id);
  const [formatId, setFormatId] = useState(FORMATS[0].id);
  const [look, setLook] = useState(DEFAULT_LOOK);
  const [customBg, setCustomBg] = useState(null); // { url, img }
  const [bgImages, setBgImages] = useState({}); // sceneId -> HTMLImageElement
  const [thumbs, setThumbs] = useState({}); // sceneId -> data URL
  const [showOriginal, setShowOriginal] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const fileRef = useRef(null);
  const bgFileRef = useRef(null);
  const canvasRef = useRef(null);
  const running = useRef(new Set());
  const boxRef = useRef(null);
  const drag = useRef(null);

  useEffect(() => {
    if (authStatus === "unauthenticated") router.push("/login");
  }, [authStatus, router]);

  /* ---------- scenes ---------- */

  const scenes = useMemo(() => (customBg ? [...SCENES, { ...CUSTOM_SCENE }] : SCENES), [customBg]);
  const scene = scenes.find((entry) => entry.id === sceneId) || SCENES[0];
  const format = FORMATS.find((entry) => entry.id === formatId) || FORMATS[0];
  const bgImage = scene.id === "custom" ? customBg?.img : bgImages[scene.id];

  // Showroom photos load once; thumbnails for the picker.
  useEffect(() => {
    let cancelled = false;
    SCENES.forEach(async (entry) => {
      try {
        const img = entry.src ? await loadImage(entry.src) : null;
        if (cancelled) return;
        if (img) setBgImages((current) => ({ ...current, [entry.id]: img }));
        setThumbs((current) => ({ ...current, [entry.id]: sceneThumb(entry, img) }));
      } catch {
        /* thumbnail stays grey */
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const pickCustomBg = async (file) => {
    if (!file?.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    try {
      const img = await loadImage(url);
      if (customBg?.url) URL.revokeObjectURL(customBg.url);
      setCustomBg({ url, img });
      setThumbs((current) => ({ ...current, custom: sceneThumb(CUSTOM_SCENE, img) }));
      setSceneId("custom");
    } catch {
      toast.error("Hintergrund konnte nicht geladen werden.");
    }
  };

  /* ---------- photos ---------- */

  const update = useCallback((id, changes) => {
    setPhotos((list) => list.map((photo) => (photo.id === id ? { ...photo, ...changes } : photo)));
  }, []);

  const addFiles = (fileList) => {
    const files = Array.from(fileList || []).filter((file) => file.type.startsWith("image/"));
    if (!files.length) return;
    const room = MAX_PHOTOS - photos.length;
    if (room <= 0) return void toast.error(`Maximal ${MAX_PHOTOS} Fotos auf einmal.`);
    const next = files.slice(0, room).map((file) => ({
      id: crypto.randomUUID(),
      file,
      name: file.name,
      originalUrl: URL.createObjectURL(file),
      status: "queued",
      error: "",
      car: null,
      place: { ...DEFAULT_PLACE },
    }));
    setPhotos((list) => [...list, ...next]);
    setSelectedId((current) => current || next[0].id);
    if (files.length > room) toast.error(`Nur ${room} weitere Fotos möglich.`);
  };

  const removePhoto = (id) => {
    setPhotos((list) => {
      const photo = list.find((entry) => entry.id === id);
      if (photo) URL.revokeObjectURL(photo.originalUrl);
      const rest = list.filter((entry) => entry.id !== id);
      setSelectedId((current) => (current === id ? rest[0]?.id || null : current));
      return rest;
    });
  };

  const clearAll = () => {
    if (!window.confirm("Alle Fotos entfernen?")) return;
    photos.forEach((photo) => URL.revokeObjectURL(photo.originalUrl));
    setPhotos([]);
    setSelectedId(null);
  };

  const retry = (id) => update(id, { status: "queued", error: "" });

  // Queue: cut out up to PARALLEL photos at a time.
  useEffect(() => {
    const waiting = photos.filter((photo) => photo.status === "queued" && !running.current.has(photo.id));
    const free = PARALLEL - running.current.size;
    waiting.slice(0, Math.max(0, free)).forEach(async (photo) => {
      running.current.add(photo.id);
      update(photo.id, { status: "working" });
      try {
        const upload = await shrinkForUpload(photo.file);
        const form = new FormData();
        form.append("image", upload);
        const res = await fetch("/api/fotostudio/cutout", { method: "POST", body: form });
        if (!res.ok) {
          const data = await res.json().catch(() => null);
          throw new Error(data?.error || `Fehler ${res.status}`);
        }
        const url = URL.createObjectURL(await res.blob());
        const car = trimCutout(await loadImage(url));
        URL.revokeObjectURL(url);
        update(photo.id, { status: "done", car });
      } catch (error) {
        update(photo.id, { status: "error", error: error.message || "Freistellen fehlgeschlagen" });
      } finally {
        running.current.delete(photo.id);
        setPhotos((list) => [...list]); // wake the queue for the next photo
      }
    });
  }, [photos, update]);

  const selected = photos.find((photo) => photo.id === selectedId) || null;

  /* ---------- preview ---------- */

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    if (!selected) {
      boxRef.current = null;
      compose(canvas, { car: null, scene, bgImage, format, settings: {} });
      return;
    }
    if (showOriginal || selected.status !== "done") {
      boxRef.current = null;
      canvas.width = format.width;
      canvas.height = format.height;
      const ctx = canvas.getContext("2d");
      ctx.fillStyle = "#f1f2f4";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      loadImage(selected.originalUrl).then((img) => {
        const scale = Math.min(canvas.width / img.naturalWidth, canvas.height / img.naturalHeight);
        const w = img.naturalWidth * scale;
        const h = img.naturalHeight * scale;
        ctx.drawImage(img, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
      });
      return;
    }
    boxRef.current = compose(canvas, { car: selected.car, scene, bgImage, format, settings: { ...look, ...selected.place } });
  }, [selected, scene, bgImage, format, look, showOriginal]);

  useEffect(() => {
    const frame = requestAnimationFrame(render);
    return () => cancelAnimationFrame(frame);
  }, [render]);

  // Drag the car in the preview.
  const toCanvas = (event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: ((event.clientX - rect.left) / rect.width) * canvas.width,
      y: ((event.clientY - rect.top) / rect.height) * canvas.height,
    };
  };
  const onPointerDown = (event) => {
    const box = boxRef.current;
    if (!box || !selected) return;
    const p = toCanvas(event);
    if (p.x < box.x || p.x > box.x + box.w || p.y < box.y || p.y > box.y + box.h) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { start: p, place: { ...selected.place } };
  };
  const onPointerMove = (event) => {
    if (!drag.current || !selected) return;
    const p = toCanvas(event);
    const { start, place } = drag.current;
    update(selected.id, {
      place: {
        ...place,
        offsetX: place.offsetX + (p.x - start.x) / format.width,
        offsetY: place.offsetY + (p.y - start.y) / format.height,
      },
    });
  };
  const onPointerUp = () => {
    drag.current = null;
  };

  const setPlace = (key, value) => selected && update(selected.id, { place: { ...selected.place, [key]: value } });
  const resetPlace = () => selected && update(selected.id, { place: { ...DEFAULT_PLACE } });
  const placeForAll = () => {
    if (!selected) return;
    setPhotos((list) => list.map((photo) => ({ ...photo, place: { ...selected.place } })));
    toast.success("Größe und Position für alle Fotos übernommen");
  };

  /* ---------- download ---------- */

  const exportPhoto = (photo) =>
    new Promise((resolve) => {
      const canvas = document.createElement("canvas");
      compose(canvas, { car: photo.car, scene, bgImage, format, settings: { ...look, ...photo.place } });
      canvas.toBlob((blob) => resolve(blob), "image/jpeg", 0.92);
    });

  const fileName = (photo) => `${photo.name.replace(/\.[^.]+$/, "")}_showroom.jpg`;

  const downloadOne = async (photo) => {
    if (photo?.status !== "done") return;
    downloadBlob(await exportPhoto(photo), fileName(photo));
  };

  const done = photos.filter((photo) => photo.status === "done");
  const downloadAll = async () => {
    setDownloading(true);
    try {
      for (const photo of done) {
        downloadBlob(await exportPhoto(photo), fileName(photo));
        await new Promise((resolve) => setTimeout(resolve, 400));
      }
    } finally {
      setDownloading(false);
    }
  };

  const busy = photos.some((photo) => photo.status === "queued" || photo.status === "working");

  /* ---------- view ---------- */

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900">
      {/* header */}
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
          <div>
            <h1 className="text-[18px] font-semibold tracking-tight">Fotostudio</h1>
            <p className="text-[13px] text-slate-500">Fahrzeugfotos freistellen und in einen Showroom setzen – das Fahrzeug bleibt unverändert.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {photos.length ? (
              <Button onClick={clearAll}>
                <FiTrash2 className="size-4" /> Alle entfernen
              </Button>
            ) : null}
            <Button onClick={() => fileRef.current?.click()}>
              <FiUpload className="size-4" /> Fotos hinzufügen
            </Button>
            <Button primary onClick={downloadAll} disabled={!done.length || downloading}>
              <FiDownload className="size-4" />
              {downloading ? "Wird heruntergeladen …" : `Alle herunterladen${done.length ? ` (${done.length})` : ""}`}
            </Button>
          </div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(event) => {
              addFiles(event.target.files);
              event.target.value = "";
            }}
          />
        </div>
      </header>

      <div className="mx-auto grid max-w-[1500px] gap-5 px-4 py-5 sm:px-6 lg:grid-cols-[250px_minmax(0,1fr)_300px]">
        {/* ---------- photos ---------- */}
        <aside className="order-2 lg:order-1">
          <div className="rounded border border-slate-200 bg-white p-4">
            <Section title="Fotos" aside={photos.length ? <span className="text-[11px] text-slate-500">{done.length}/{photos.length} fertig</span> : null}>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragOver(false);
                  addFiles(event.dataTransfer.files);
                }}
                className={`flex w-full flex-col items-center gap-1 rounded border border-dashed px-3 py-5 text-center text-[12px] transition-colors ${
                  dragOver ? "border-slate-500 bg-slate-100" : "border-slate-300 hover:bg-slate-50"
                }`}
              >
                <FiUpload className="size-4 text-slate-500" />
                <span className="font-medium text-slate-700">Fotos hierher ziehen</span>
                <span className="text-slate-500">oder klicken · bis {MAX_PHOTOS} Fotos</span>
              </button>

              {photos.length ? (
                <ul className="mt-3 max-h-[60vh] divide-y divide-slate-100 overflow-y-auto">
                  {photos.map((photo) => {
                    const active = photo.id === selectedId;
                    const state = STATUS[photo.status];
                    return (
                      <li key={photo.id}>
                        <div
                          role="button"
                          tabIndex={0}
                          onClick={() => setSelectedId(photo.id)}
                          onKeyDown={(event) => event.key === "Enter" && setSelectedId(photo.id)}
                          className={`group flex cursor-pointer items-center gap-2.5 px-1.5 py-2 ${active ? "bg-slate-100" : "hover:bg-slate-50"}`}
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photo.originalUrl} alt="" className="h-9 w-12 shrink-0 rounded-sm object-cover" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-[12px] text-slate-800">{photo.name}</p>
                            <p className={`truncate text-[11px] ${state.tone}`} title={photo.error || undefined}>
                              {photo.status === "error" ? photo.error : state.label}
                            </p>
                          </div>
                          {photo.status === "error" ? (
                            <button type="button" title="Erneut versuchen" onClick={(event) => (event.stopPropagation(), retry(photo.id))} className="rounded p-1 text-slate-500 hover:bg-white hover:text-slate-900">
                              <FiRefreshCw className="size-3.5" />
                            </button>
                          ) : null}
                          <button
                            type="button"
                            title="Entfernen"
                            onClick={(event) => (event.stopPropagation(), removePhoto(photo.id))}
                            className="rounded p-1 text-slate-400 opacity-70 hover:bg-white hover:text-slate-900 group-hover:opacity-100"
                          >
                            <FiX className="size-3.5" />
                          </button>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              ) : null}
            </Section>
          </div>
        </aside>

        {/* ---------- preview ---------- */}
        <section className="order-1 min-w-0 lg:order-2">
          <div className="rounded border border-slate-200 bg-white p-3">
            <div className="relative overflow-hidden rounded-sm bg-slate-100" style={{ aspectRatio: `${format.width} / ${format.height}` }}>
              <canvas
                ref={canvasRef}
                onPointerDown={onPointerDown}
                onPointerMove={onPointerMove}
                onPointerUp={onPointerUp}
                onPointerCancel={onPointerUp}
                className={`block size-full touch-none ${selected?.status === "done" && !showOriginal ? "cursor-grab active:cursor-grabbing" : ""}`}
              />
              {!photos.length ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-white/70 text-center">
                  <FiImage className="size-6 text-slate-400" />
                  <p className="text-[14px] font-medium text-slate-700">Noch keine Fotos</p>
                  <p className="max-w-xs text-[12px] text-slate-500">Fotos hinzufügen – jedes Fahrzeug wird freigestellt und in den gewählten Showroom gesetzt.</p>
                  <Button className="mt-1" onClick={() => fileRef.current?.click()}>
                    <FiUpload className="size-4" /> Fotos hinzufügen
                  </Button>
                </div>
              ) : selected && selected.status !== "done" && !showOriginal ? (
                <div className="absolute inset-x-0 bottom-0 flex items-center justify-center bg-white/85 py-2 text-[12px] text-slate-700">
                  {selected.status === "error" ? (
                    <span className="flex items-center gap-2 text-red-700">
                      {selected.error}
                      <button type="button" className="underline" onClick={() => retry(selected.id)}>
                        Erneut versuchen
                      </button>
                    </span>
                  ) : (
                    <span className="flex items-center gap-2">
                      <span className="size-3 animate-spin rounded-full border-2 border-slate-300 border-t-slate-700" />
                      {selected.status === "working" ? "Fahrzeug wird freigestellt …" : "Wartet auf Freistellung …"}
                    </span>
                  )}
                </div>
              ) : null}
            </div>

            <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[12px] text-slate-500">
                {selected?.status === "done" ? "Tipp: Das Fahrzeug im Bild mit der Maus verschieben." : selected ? selected.name : " "}
              </p>
              <div className="flex gap-2">
                <Button onClick={() => setShowOriginal((value) => !value)} disabled={!selected}>
                  {showOriginal ? "Ergebnis zeigen" : "Original zeigen"}
                </Button>
                <Button primary onClick={() => downloadOne(selected)} disabled={selected?.status !== "done"}>
                  <FiDownload className="size-4" /> Herunterladen
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* ---------- settings ---------- */}
        <aside className="order-3 space-y-6 rounded border border-slate-200 bg-white p-4">
          <Section
            title="Hintergrund"
            aside={
              <button type="button" className="text-[12px] text-slate-700 underline underline-offset-2" onClick={() => bgFileRef.current?.click()}>
                Eigenes Bild
              </button>
            }
          >
            <div className="grid grid-cols-2 gap-2">
              {scenes.map((entry) => {
                const active = entry.id === scene.id;
                return (
                  <button
                    key={entry.id}
                    type="button"
                    title={entry.hint}
                    onClick={() => setSceneId(entry.id)}
                    className={`overflow-hidden rounded-sm border text-left transition-colors ${active ? "border-slate-800 ring-1 ring-slate-800" : "border-slate-200 hover:border-slate-400"}`}
                  >
                    {thumbs[entry.id] ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={thumbs[entry.id]} alt="" className="aspect-[4/3] w-full object-cover" />
                    ) : (
                      <span className="block aspect-[4/3] w-full bg-slate-100" />
                    )}
                    <span className={`block truncate px-1.5 py-1 text-[11px] ${active ? "font-semibold text-slate-900" : "text-slate-600"}`}>{entry.label}</span>
                  </button>
                );
              })}
            </div>
            <input
              ref={bgFileRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(event) => {
                pickCustomBg(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
          </Section>

          <Section title="Format">
            <div className="space-y-1.5">
              {FORMATS.map((entry) => (
                <label key={entry.id} className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
                  <input type="radio" name="format" checked={formatId === entry.id} onChange={() => setFormatId(entry.id)} className="size-4 accent-slate-700" />
                  {entry.label}
                  <span className="text-[11px] text-slate-400">
                    {entry.width} × {entry.height}
                  </span>
                </label>
              ))}
            </div>
          </Section>

          <Section
            title="Fahrzeug"
            aside={
              <button type="button" className="text-[12px] text-slate-700 underline underline-offset-2 disabled:opacity-40" onClick={resetPlace} disabled={!selected}>
                Zurücksetzen
              </button>
            }
          >
            <div className="space-y-3">
              <Slider label="Größe" value={selected?.place.scale ?? 1} min={0.6} max={1.4} onChange={(v) => setPlace("scale", v)} format={percent} />
              <Slider
                label="Höhe"
                value={-(selected?.place.offsetY ?? 0)}
                min={-0.2}
                max={0.2}
                step={0.005}
                onChange={(v) => setPlace("offsetY", -v)}
                format={(v) => `${v >= 0 ? "+" : ""}${Math.round(v * 100)}`}
              />
              <Slider
                label="Seitlich"
                value={selected?.place.offsetX ?? 0}
                min={-0.25}
                max={0.25}
                step={0.005}
                onChange={(v) => setPlace("offsetX", v)}
                format={(v) => `${v >= 0 ? "+" : ""}${Math.round(v * 100)}`}
              />
              <Button className="w-full" onClick={placeForAll} disabled={!selected || photos.length < 2}>
                Für alle Fotos übernehmen
              </Button>
            </div>
          </Section>

          <Section title="Licht">
            <div className="space-y-3">
              <Slider label="Schatten" value={look.shadow} min={0} max={1.5} onChange={(v) => setLook((l) => ({ ...l, shadow: v }))} format={percent} />
              <Slider label="Spiegelung" value={look.reflection} min={0} max={2} onChange={(v) => setLook((l) => ({ ...l, reflection: v }))} format={percent} />
              <label className="flex cursor-pointer items-center gap-2 text-[13px] text-slate-700">
                <input type="checkbox" checked={look.harmonize} onChange={(e) => setLook((l) => ({ ...l, harmonize: e.target.checked }))} className="size-4 accent-slate-700" />
                Licht an den Raum angleichen
              </label>
            </div>
          </Section>

          {busy ? <p className="text-[12px] text-slate-500">Fotos werden freigestellt …</p> : null}
        </aside>
      </div>
    </main>
  );
}

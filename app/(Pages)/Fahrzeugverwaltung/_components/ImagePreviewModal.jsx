"use client";

/**
 * Full-screen viewer for the photo of the registration document: turned
 * upright, sized to fit the screen, with rotate, zoom, print and open.
 */

import { useEffect, useRef, useState } from "react";
import { FiExternalLink, FiMinus, FiPlus, FiPrinter, FiRotateCcw, FiRotateCw, FiX } from "react-icons/fi";

// The photos are taken sideways, so they start turned upright.
const START_ROTATION = 270;
const ZOOMS = [1, 1.5, 2, 3];

export default function ImagePreviewModal({ open, schein, onClose, onPrint }) {
  const [rotation, setRotation] = useState(START_ROTATION);
  const [zoom, setZoom] = useState(0);
  const [natural, setNatural] = useState(null); // the photo's own size
  const [area, setArea] = useState(null); // room on screen
  const areaRef = useRef(null);
  const loaded = Boolean(natural);

  useEffect(() => {
    if (!open) return undefined;
    setRotation(START_ROTATION);
    setZoom(0);
    setNatural(null);
    const onKey = (event) => {
      if (event.key === "Escape") onClose();
      if (event.key === "ArrowLeft") setRotation((r) => (r + 270) % 360);
      if (event.key === "ArrowRight") setRotation((r) => (r + 90) % 360);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  useEffect(() => {
    const node = areaRef.current;
    if (!open || !node) return undefined;
    const measure = () => setArea({ width: node.clientWidth - 32, height: node.clientHeight - 32 });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [open]);

  if (!open || !schein?.imageUrl) return null;

  // A turned photo swaps width and height: the frame gets the turned size
  // (so it fits and scrolls correctly), the photo is turned inside it.
  const sideways = rotation % 180 !== 0;
  const scale = ZOOMS[zoom];
  let frame = null;
  if (natural && area) {
    const shownW = sideways ? natural.height : natural.width;
    const shownH = sideways ? natural.width : natural.height;
    const fit = Math.min(area.width / shownW, area.height / shownH);
    frame = { width: shownW * fit * scale, height: shownH * fit * scale };
  }
  const imageSize = frame ? (sideways ? { width: frame.height, height: frame.width } : frame) : { maxWidth: "100%", maxHeight: "100%" };

  const tool =
    "inline-flex size-9 items-center justify-center rounded-lg text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-30 disabled:hover:bg-transparent";

  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-slate-950" role="dialog" aria-modal="true" aria-label="Fahrzeugschein">
      <header className="flex h-14 shrink-0 items-center justify-between gap-3 border-b border-white/10 px-3 sm:px-5">
        <div className="min-w-0">
          <p className="truncate text-[14px] font-semibold text-white">{schein.carName || "Fahrzeugschein"}</p>
          <p className="truncate font-mono text-[11px] text-slate-400">{schein.finNumber || "Keine FIN"}</p>
        </div>
        <button type="button" title="Schließen (Esc)" aria-label="Schließen" onClick={onClose} className={tool}>
          <FiX className="size-5" />
        </button>
      </header>

      <div
        ref={areaRef}
        className="relative flex min-h-0 flex-1 overflow-auto p-4"
        onClick={(event) => {
          if (event.target === event.currentTarget) onClose();
        }}
      >
        {!loaded ? <span className="absolute left-1/2 top-1/2 size-8 -translate-x-1/2 -translate-y-1/2 animate-spin rounded-full border-2 border-white/20 border-t-green-400" /> : null}
        <div className="relative m-auto shrink-0" style={frame || { width: 1, height: 1 }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={schein.imageUrl}
            alt={`Fahrzeugschein ${schein.carName || ""}`}
            onLoad={(event) => setNatural({ width: event.currentTarget.naturalWidth || 1, height: event.currentTarget.naturalHeight || 1 })}
            className={`absolute left-1/2 top-1/2 max-w-none rounded-md bg-white shadow-2xl transition-opacity duration-200 ${frame ? "opacity-100" : "opacity-0"}`}
            style={{ ...imageSize, transform: `translate(-50%, -50%) rotate(${rotation}deg)` }}
          />
        </div>
      </div>

      <footer className="flex shrink-0 justify-center px-3 pb-4 pt-2">
        <div className="flex items-center gap-0.5 rounded-xl border border-white/10 bg-slate-900/90 p-1 shadow-xl">
          <button type="button" title="Nach links drehen (←)" aria-label="Nach links drehen" onClick={() => setRotation((r) => (r + 270) % 360)} className={tool}>
            <FiRotateCcw className="size-4" />
          </button>
          <button type="button" title="Nach rechts drehen (→)" aria-label="Nach rechts drehen" onClick={() => setRotation((r) => (r + 90) % 360)} className={tool}>
            <FiRotateCw className="size-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-white/10" />
          <button type="button" title="Verkleinern" aria-label="Verkleinern" disabled={zoom === 0} onClick={() => setZoom((z) => Math.max(0, z - 1))} className={tool}>
            <FiMinus className="size-4" />
          </button>
          <span className="w-11 text-center text-[12px] tabular-nums text-slate-300">{Math.round(scale * 100)}%</span>
          <button type="button" title="Vergrößern" aria-label="Vergrößern" disabled={zoom === ZOOMS.length - 1} onClick={() => setZoom((z) => Math.min(ZOOMS.length - 1, z + 1))} className={tool}>
            <FiPlus className="size-4" />
          </button>
          <span className="mx-1 h-5 w-px bg-white/10" />
          {onPrint ? (
            <button type="button" title="Drucken" aria-label="Drucken" onClick={onPrint} className={tool}>
              <FiPrinter className="size-4" />
            </button>
          ) : null}
          <a href={schein.imageUrl} target="_blank" rel="noopener noreferrer" title="Original öffnen" aria-label="Original öffnen" className={tool}>
            <FiExternalLink className="size-4" />
          </a>
        </div>
      </footer>
    </div>
  );
}

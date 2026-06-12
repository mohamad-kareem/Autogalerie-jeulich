"use client";

import { useState, useRef, useCallback } from "react";

const PRESET_BACKGROUNDS = [
  {
    id: "showroom_autogalerie",
    label: "Autogalerie Jülich",
    file: "/showroom.png",
    thumb: "/showroom.png",
    description: "Euer Showroom — Autogalerie Jülich",
    featured: true,
  },
  {
    id: "studio_white",
    label: "Studio Weiß",
    color: "#f5f5f5",
    description: "Standard mobile.de",
  },
  {
    id: "studio_gray",
    label: "Studio Grau",
    color: "#d0d0d0",
    description: "Neutrales Grau",
  },
  {
    id: "studio_dark",
    label: "Studio Dunkel",
    color: "#1a1a1a",
    description: "Premium dunkel",
  },
];

const DEFAULT_COMP = { scale: 55, bottom: 72, rotate: 0 };

export default function FotoStudioPage() {
  const [photos, setPhotos] = useState([]);
  const [selectedBgId, setSelectedBgId] = useState("showroom_autogalerie");
  const [customBg, setCustomBg] = useState(null);
  const [dragOver, setDragOver] = useState(false);
  const [processingAll, setProcessingAll] = useState(false);
  const [comp, setComp] = useState(DEFAULT_COMP);

  const fileInputRef = useRef(null);
  const bgInputRef = useRef(null);

  const allBgs = customBg
    ? [
        {
          id: "custom",
          label: "Eigener",
          file: customBg.url,
          thumb: customBg.url,
          description: "Dein Hintergrund",
        },
        ...PRESET_BACKGROUNDS,
      ]
    : PRESET_BACKGROUNDS;
  const activeBg = allBgs.find((b) => b.id === selectedBgId) || allBgs[0];

  const addFiles = (files) => {
    const next = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, Math.max(0, 20 - photos.length))
      .map((f) => ({
        id: crypto.randomUUID(),
        file: f,
        previewUrl: URL.createObjectURL(f),
        resultUrl: null,
        status: "ready",
        error: null,
        cutout: null,
      }));
    setPhotos((p) => [...p, ...next]);
  };

  const loadCustomBg = (f) => {
    if (!f || !f.type.startsWith("image/")) return;
    setCustomBg({ url: URL.createObjectURL(f) });
    setSelectedBgId("custom");
  };

  const onDrop = useCallback(
    (e) => {
      e.preventDefault();
      setDragOver(false);
      addFiles(e.dataTransfer.files);
    },
    [photos],
  );
  const removePhoto = (id) => setPhotos((p) => p.filter((x) => x.id !== id));

  const loadImg = (src) =>
    new Promise(async (resolve, reject) => {
      const img = new Image();
      if (src.startsWith("data:")) {
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = src;
        return;
      }
      try {
        const blob = await (await fetch(src)).blob();
        const url = URL.createObjectURL(blob);
        img.onload = () => {
          URL.revokeObjectURL(url);
          resolve(img);
        };
        img.onerror = reject;
        img.src = url;
      } catch (e) {
        reject(e);
      }
    });

  const composite = async (cutoutBase64, bg, c) => {
    const carImg = await loadImg(`data:image/png;base64,${cutoutBase64}`);
    const OUT_W = 1600,
      OUT_H = 900;
    const canvas = document.createElement("canvas");
    canvas.width = OUT_W;
    canvas.height = OUT_H;
    const ctx = canvas.getContext("2d");

    // 1. Background
    if (bg.file) {
      try {
        const bgImg = await loadImg(bg.file);
        const s = Math.max(
          OUT_W / bgImg.naturalWidth,
          OUT_H / bgImg.naturalHeight,
        );
        ctx.drawImage(
          bgImg,
          (OUT_W - bgImg.naturalWidth * s) / 2,
          (OUT_H - bgImg.naturalHeight * s) / 2,
          bgImg.naturalWidth * s,
          bgImg.naturalHeight * s,
        );
      } catch {
        ctx.fillStyle = "#f0f0f0";
        ctx.fillRect(0, 0, OUT_W, OUT_H);
      }
    } else {
      ctx.fillStyle = bg.color || "#fff";
      ctx.fillRect(0, 0, OUT_W, OUT_H);
    }

    // 2. Car size
    const carW = OUT_W * (c.scale / 100);
    const carH = (carImg.naturalHeight / carImg.naturalWidth) * carW;

    // 3. Position — bottom value goes from 40 (high up) to 130 (well below frame = very low)
    // bottomFraction can exceed 1.0 so car can go below visible area
    const bottomFraction = c.bottom / 100;
    const carBottomY = OUT_H * bottomFraction;
    const carY = carBottomY - carH;
    const carX = (OUT_W - carW) / 2;

    // 4. Draw car with rotation around its center-bottom
    const rad = (c.rotate * Math.PI) / 180;
    ctx.save();
    ctx.translate(carX + carW / 2, carBottomY);
    ctx.rotate(rad);
    ctx.drawImage(carImg, -carW / 2, -carH, carW, carH);
    ctx.restore();

    return canvas.toDataURL("image/jpeg", 0.94);
  };

  const processOne = async (photo, c) => {
    const form = new FormData();
    form.append("image", photo.file);
    const res = await fetch("/api/remove-bg", { method: "POST", body: form });
    const data = await res.json();
    if (!res.ok || data.error) throw new Error(data.error || "remove.bg error");
    return {
      cutout: data.base64png,
      result: await composite(data.base64png, activeBg, c),
    };
  };

  const processAll = async () => {
    const queue = photos.filter(
      (p) => p.status === "ready" || p.status === "error",
    );
    if (!queue.length) return;
    setProcessingAll(true);
    for (const photo of queue) {
      setPhotos((p) =>
        p.map((x) => (x.id === photo.id ? { ...x, status: "processing" } : x)),
      );
      try {
        const { cutout, result } = await processOne(photo, comp);
        setPhotos((p) =>
          p.map((x) =>
            x.id === photo.id
              ? { ...x, status: "done", resultUrl: result, cutout }
              : x,
          ),
        );
      } catch (err) {
        setPhotos((p) =>
          p.map((x) =>
            x.id === photo.id
              ? { ...x, status: "error", error: err.message }
              : x,
          ),
        );
      }
    }
    setProcessingAll(false);
  };

  const recomposeAll = async (newComp, newBg) => {
    const bg = newBg || activeBg;
    const done = photos.filter((p) => p.status === "done" && p.cutout);
    for (const photo of done) {
      const result = await composite(photo.cutout, bg, newComp);
      setPhotos((p) =>
        p.map((x) => (x.id === photo.id ? { ...x, resultUrl: result } : x)),
      );
    }
  };

  const updateComp = (key, value) => {
    const next = { ...comp, [key]: value };
    setComp(next);
    recomposeAll(next);
  };

  const resetComp = () => {
    setComp(DEFAULT_COMP);
    recomposeAll(DEFAULT_COMP);
  };

  const downloadOne = (photo) => {
    const a = document.createElement("a");
    a.href = photo.resultUrl;
    a.download = photo.file.name.replace(/\.[^.]+$/, "") + "_studio.jpg";
    a.click();
  };

  const downloadAll = () =>
    photos
      .filter((p) => p.status === "done")
      .forEach((p, i) => setTimeout(() => downloadOne(p), i * 350));

  const doneCount = photos.filter((p) => p.status === "done").length;
  const readyCount = photos.filter(
    (p) => p.status === "ready" || p.status === "error",
  ).length;
  const processingCount = photos.filter(
    (p) => p.status === "processing",
  ).length;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#f2f2f0",
        fontFamily: "'Segoe UI',system-ui,sans-serif",
        paddingBottom: "4rem",
      }}
    >
      {/* TOPBAR */}
      <div
        style={{
          background: "#fff",
          borderBottom: "1px solid #e2e2e0",
          padding: "16px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div>
          <p
            style={{
              fontSize: "9px",
              fontWeight: 700,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              color: "#146c2e",
              marginBottom: "2px",
            }}
          >
            Autogalerie Jülich
          </p>
          <h1
            style={{
              fontSize: "18px",
              fontWeight: 700,
              color: "#0f1a0f",
              margin: 0,
            }}
          >
            Foto Studio
          </h1>
        </div>
        <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
          {photos.length > 0 && (
            <button
              onClick={() => setPhotos([])}
              style={btn("#fff", "#ddd", "#666")}
            >
              Alle löschen
            </button>
          )}
          {doneCount > 0 && (
            <button
              onClick={downloadAll}
              style={{ ...btn("#fff", "#146c2e", "#146c2e"), fontWeight: 600 }}
            >
              ↓ Alle laden ({doneCount})
            </button>
          )}
          {readyCount > 0 && (
            <button
              onClick={processAll}
              disabled={processingAll}
              style={{
                ...btn(processingAll ? "#7aa887" : "#146c2e", "none", "#fff"),
                fontWeight: 700,
                display: "flex",
                alignItems: "center",
                gap: "7px",
                cursor: processingAll ? "not-allowed" : "pointer",
              }}
            >
              {processingAll ? (
                <>
                  <Spin /> Verarbeitung...
                </>
              ) : (
                `${readyCount} Foto${readyCount > 1 ? "s" : ""} verarbeiten`
              )}
            </button>
          )}
        </div>
      </div>

      <div
        style={{ maxWidth: "1280px", margin: "0 auto", padding: "28px 32px" }}
      >
        {/* BACKGROUND */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #e2e2e0",
            padding: "20px 22px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "14px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#146c2e",
                margin: 0,
              }}
            >
              Hintergrund
            </p>
            <button
              onClick={() => bgInputRef.current?.click()}
              style={{
                height: "28px",
                padding: "0 13px",
                borderRadius: "6px",
                border: "1.5px dashed #146c2e",
                background: "#f0f7f2",
                fontSize: "11px",
                fontWeight: 600,
                color: "#146c2e",
                cursor: "pointer",
              }}
            >
              + Eigener
            </button>
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              onChange={(e) => loadCustomBg(e.target.files[0])}
              style={{ display: "none" }}
            />
          </div>
          <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
            {allBgs.map((bg) => {
              const on = selectedBgId === bg.id;
              return (
                <button
                  key={bg.id}
                  onClick={() => {
                    setSelectedBgId(bg.id);
                    recomposeAll(comp, bg);
                  }}
                  style={{
                    position: "relative",
                    borderRadius: "10px",
                    border: on ? "3px solid #146c2e" : "2px solid #e0e0e0",
                    padding: 0,
                    cursor: "pointer",
                    overflow: "hidden",
                    width: "140px",
                    flexShrink: 0,
                    boxShadow: on ? "0 0 0 3px rgba(20,108,46,0.12)" : "none",
                    transition: "all .15s",
                    background: "none",
                  }}
                >
                  <div
                    style={{
                      height: "80px",
                      background: bg.thumb
                        ? `url(${bg.thumb}) center/cover`
                        : bg.color,
                      position: "relative",
                    }}
                  >
                    {bg.featured && (
                      <div
                        style={{
                          position: "absolute",
                          top: 5,
                          left: 5,
                          background: "#146c2e",
                          borderRadius: "3px",
                          padding: "2px 6px",
                          fontSize: "8px",
                          fontWeight: 700,
                          color: "#fff",
                        }}
                      >
                        ★ SHOWROOM
                      </div>
                    )}
                    {on && (
                      <div
                        style={{
                          position: "absolute",
                          top: 5,
                          right: 5,
                          width: 18,
                          height: 18,
                          borderRadius: "50%",
                          background: "#146c2e",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                        }}
                      >
                        <svg
                          width="10"
                          height="10"
                          viewBox="0 0 24 24"
                          fill="none"
                          stroke="#fff"
                          strokeWidth="3.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        >
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                    )}
                  </div>
                  <div style={{ padding: "6px 9px", background: "#fff" }}>
                    <p
                      style={{
                        fontSize: "11px",
                        fontWeight: 700,
                        color: on ? "#146c2e" : "#222",
                        margin: 0,
                      }}
                    >
                      {bg.label}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* CONTROLS */}
        <div
          style={{
            background: "#fff",
            borderRadius: "12px",
            border: "1px solid #e2e2e0",
            padding: "20px 24px",
            marginBottom: "14px",
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: "18px",
            }}
          >
            <p
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.16em",
                textTransform: "uppercase",
                color: "#146c2e",
                margin: 0,
              }}
            >
              Fahrzeug anpassen
            </p>
            <button
              onClick={resetComp}
              style={{
                height: "26px",
                padding: "0 12px",
                borderRadius: "5px",
                border: "1px solid #ddd",
                background: "#fff",
                fontSize: "11px",
                color: "#888",
                cursor: "pointer",
              }}
            >
              Zurücksetzen
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "28px",
            }}
          >
            {/* SIZE */}
            <CtrlBlock icon="⊞" label="Größe" value={`${comp.scale}%`}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <IconBtn
                  onClick={() =>
                    updateComp("scale", Math.max(15, comp.scale - 5))
                  }
                >
                  −
                </IconBtn>
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    height: "4px",
                    borderRadius: "2px",
                    background: "#eee",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "4px",
                      borderRadius: "2px",
                      background: "#146c2e",
                      width: `${((comp.scale - 15) / (95 - 15)) * 100}%`,
                    }}
                  />
                  <input
                    type="range"
                    min={15}
                    max={95}
                    step={1}
                    value={comp.scale}
                    onChange={(e) =>
                      updateComp("scale", Number(e.target.value))
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      height: "20px",
                      top: "-8px",
                    }}
                  />
                </div>
                <IconBtn
                  onClick={() =>
                    updateComp("scale", Math.min(95, comp.scale + 5))
                  }
                >
                  +
                </IconBtn>
              </div>
            </CtrlBlock>

            {/* VERTICAL POSITION */}
            <CtrlBlock icon="↕" label="Hoch / Runter" value={`${comp.bottom}%`}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <IconBtn
                  onClick={() =>
                    updateComp("bottom", Math.max(30, comp.bottom - 3))
                  }
                >
                  ↑
                </IconBtn>
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    height: "4px",
                    borderRadius: "2px",
                    background: "#eee",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 0,
                      top: 0,
                      height: "4px",
                      borderRadius: "2px",
                      background: "#146c2e",
                      width: `${((comp.bottom - 30) / (130 - 30)) * 100}%`,
                    }}
                  />
                  <input
                    type="range"
                    min={30}
                    max={130}
                    step={1}
                    value={comp.bottom}
                    onChange={(e) =>
                      updateComp("bottom", Number(e.target.value))
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      height: "20px",
                      top: "-8px",
                    }}
                  />
                </div>
                <IconBtn
                  onClick={() =>
                    updateComp("bottom", Math.min(130, comp.bottom + 3))
                  }
                >
                  ↓
                </IconBtn>
              </div>
            </CtrlBlock>

            {/* ROTATION */}
            <CtrlBlock icon="↻" label="Drehen" value={`${comp.rotate}°`}>
              <div
                style={{ display: "flex", alignItems: "center", gap: "10px" }}
              >
                <IconBtn
                  onClick={() =>
                    updateComp("rotate", Math.max(-30, comp.rotate - 2))
                  }
                >
                  ↺
                </IconBtn>
                <div
                  style={{
                    flex: 1,
                    position: "relative",
                    height: "4px",
                    borderRadius: "2px",
                    background: "#eee",
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: "50%",
                      top: 0,
                      height: "4px",
                      borderRadius: "2px",
                      background: "#146c2e",
                      width: `${(Math.abs(comp.rotate) / 30) * 50}%`,
                      ...(comp.rotate >= 0
                        ? { left: "50%" }
                        : { right: "50%", left: "auto" }),
                    }}
                  />
                  <input
                    type="range"
                    min={-30}
                    max={30}
                    step={1}
                    value={comp.rotate}
                    onChange={(e) =>
                      updateComp("rotate", Number(e.target.value))
                    }
                    style={{
                      position: "absolute",
                      inset: 0,
                      width: "100%",
                      opacity: 0,
                      cursor: "pointer",
                      height: "20px",
                      top: "-8px",
                    }}
                  />
                </div>
                <IconBtn
                  onClick={() =>
                    updateComp("rotate", Math.min(30, comp.rotate + 2))
                  }
                >
                  ↻
                </IconBtn>
              </div>
              <button
                onClick={() => updateComp("rotate", 0)}
                style={{
                  marginTop: "8px",
                  width: "100%",
                  height: "24px",
                  borderRadius: "5px",
                  border: "1px solid #eee",
                  background: "#fafafa",
                  fontSize: "10px",
                  color: "#888",
                  cursor: "pointer",
                }}
              >
                Gerade stellen
              </button>
            </CtrlBlock>
          </div>

          {doneCount > 0 && (
            <p
              style={{
                fontSize: "11px",
                color: "#aaa",
                marginTop: "16px",
                marginBottom: 0,
                textAlign: "center",
              }}
            >
              Änderungen werden sofort auf alle {doneCount} fertigen Fotos
              angewendet
            </p>
          )}
        </div>

        {/* UPLOAD */}
        {photos.length < 20 && (
          <div
            onClick={() => fileInputRef.current?.click()}
            onDrop={onDrop}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOver(true);
            }}
            onDragLeave={() => setDragOver(false)}
            style={{
              border: dragOver ? "2px dashed #146c2e" : "2px dashed #c8cdc8",
              borderRadius: "12px",
              background: dragOver ? "#f0f7f2" : "#fafaf8",
              padding: "30px 20px",
              textAlign: "center",
              cursor: "pointer",
              transition: "all .15s",
              marginBottom: "14px",
            }}
          >
            <svg
              width="34"
              height="34"
              viewBox="0 0 24 24"
              fill="none"
              stroke={dragOver ? "#146c2e" : "#b0b8b0"}
              strokeWidth="1.5"
              strokeLinecap="round"
              style={{ display: "block", margin: "0 auto 10px" }}
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="17 8 12 3 7 8" />
              <line x1="12" y1="3" x2="12" y2="15" />
            </svg>
            <p
              style={{
                fontSize: "14px",
                fontWeight: 600,
                color: dragOver ? "#146c2e" : "#555",
                margin: "0 0 3px",
              }}
            >
              Fotos hier ablegen oder klicken
            </p>
            <p style={{ fontSize: "12px", color: "#999", margin: 0 }}>
              Noch {20 - photos.length} möglich · JPG, PNG, WEBP
            </p>
          </div>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          multiple
          onChange={(e) => addFiles(e.target.files)}
          style={{ display: "none" }}
        />

        {photos.length > 0 && (
          <div
            style={{
              display: "flex",
              gap: "14px",
              marginBottom: "12px",
              fontSize: "13px",
              color: "#666",
              alignItems: "center",
            }}
          >
            <span>
              <b style={{ color: "#0f1a0f" }}>{photos.length}</b> Fotos
            </span>
            {doneCount > 0 && (
              <span style={{ color: "#146c2e" }}>✓ {doneCount} fertig</span>
            )}
            {processingCount > 0 && (
              <span style={{ color: "#e07b00" }}>
                ⟳ {processingCount} läuft
              </span>
            )}
            {readyCount > 0 && <span>{readyCount} bereit</span>}
          </div>
        )}

        {photos.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill,minmax(260px,1fr))",
              gap: "14px",
            }}
          >
            {photos.map((p) => (
              <PhotoCard
                key={p.id}
                photo={p}
                onRemove={() => removePhoto(p.id)}
                onDownload={() => downloadOne(p)}
              />
            ))}
          </div>
        )}

        {photos.length === 0 && (
          <div style={{ textAlign: "center", padding: "50px 20px" }}>
            <svg
              width="52"
              height="52"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#d0d8d0"
              strokeWidth="1.2"
              strokeLinecap="round"
              style={{ display: "block", margin: "0 auto 14px" }}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            <p
              style={{
                fontSize: "15px",
                fontWeight: 600,
                color: "#888",
                margin: "0 0 5px",
              }}
            >
              Noch keine Fotos
            </p>
            <p style={{ fontSize: "13px", color: "#aaa", margin: 0 }}>
              Lade 16–20 Fotos deines Fahrzeugs hoch
            </p>
          </div>
        )}
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ── CONTROL BLOCK ── */
function CtrlBlock({ icon, label, value, children }) {
  return (
    <div>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: "10px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ fontSize: "15px", lineHeight: 1 }}>{icon}</span>
          <span style={{ fontSize: "12px", fontWeight: 600, color: "#333" }}>
            {label}
          </span>
        </div>
        <span
          style={{
            fontSize: "13px",
            fontWeight: 700,
            color: "#146c2e",
            minWidth: "40px",
            textAlign: "right",
          }}
        >
          {value}
        </span>
      </div>
      {children}
    </div>
  );
}

/* ── ICON BUTTON ── */
function IconBtn({ children, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "32px",
        height: "32px",
        borderRadius: "8px",
        border: "1px solid #e4e4e4",
        background: "#fafafa",
        color: "#333",
        fontSize: "14px",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
        fontWeight: 600,
      }}
    >
      {children}
    </button>
  );
}

/* ── PHOTO CARD ── */
function PhotoCard({ photo, onRemove, onDownload }) {
  const [showResult, setShowResult] = useState(true);
  const st = {
    ready: {
      border: "#e0e0de",
      badge: "#888",
      badgeBg: "#eee",
      label: "Bereit",
    },
    processing: {
      border: "#f0d080",
      badge: "#a06000",
      badgeBg: "#fff3cc",
      label: "Verarbeitung...",
    },
    done: {
      border: "#b8dfc4",
      badge: "#146c2e",
      badgeBg: "#dff0e6",
      label: "Fertig",
    },
    error: {
      border: "#f0b8b8",
      badge: "#c0392b",
      badgeBg: "#fde0e0",
      label: "Fehler",
    },
  }[photo.status];

  return (
    <div
      style={{
        borderRadius: "10px",
        border: `1.5px solid ${st.border}`,
        background: "#fff",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "relative",
          aspectRatio: "16/9",
          overflow: "hidden",
          background: "#e8e8e6",
        }}
      >
        <img
          src={
            photo.status === "done" && showResult
              ? photo.resultUrl
              : photo.previewUrl
          }
          alt=""
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            display: "block",
          }}
        />
        {photo.status === "processing" && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              background: "rgba(255,251,240,0.88)",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: "10px",
            }}
          >
            <div
              style={{
                width: "32px",
                height: "32px",
                border: "3px solid rgba(160,96,0,0.2)",
                borderTopColor: "#e07b00",
                borderRadius: "50%",
                animation: "spin 0.8s linear infinite",
              }}
            />
            <p style={{ fontSize: "12px", fontWeight: 600, color: "#a06000" }}>
              Hintergrund wird entfernt...
            </p>
          </div>
        )}
        {photo.status === "done" && (
          <button
            onClick={() => setShowResult((v) => !v)}
            style={{
              position: "absolute",
              bottom: 8,
              left: 8,
              height: "24px",
              padding: "0 10px",
              borderRadius: "12px",
              border: "none",
              background: "rgba(0,0,0,0.55)",
              color: "#fff",
              fontSize: "10px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {showResult ? "Vorher" : "Nachher"}
          </button>
        )}
        <button
          onClick={onRemove}
          style={{
            position: "absolute",
            top: 6,
            right: 6,
            width: 24,
            height: 24,
            borderRadius: "50%",
            border: "none",
            background: "rgba(0,0,0,0.45)",
            color: "#fff",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "12px",
            fontWeight: 700,
          }}
        >
          ✕
        </button>
      </div>
      <div
        style={{
          padding: "10px 12px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "8px",
        }}
      >
        <p
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "#222",
            margin: 0,
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
            flex: 1,
          }}
        >
          {photo.file.name.replace(/\.[^.]+$/, "")}
        </p>
        <div
          style={{
            display: "flex",
            gap: "6px",
            alignItems: "center",
            flexShrink: 0,
          }}
        >
          <span
            style={{
              fontSize: "10px",
              fontWeight: 700,
              padding: "2px 8px",
              borderRadius: "4px",
              color: st.badge,
              background: st.badgeBg,
            }}
          >
            {st.label}
          </span>
          {photo.status === "done" && (
            <button
              onClick={onDownload}
              style={{
                height: "26px",
                padding: "0 10px",
                borderRadius: "6px",
                border: "none",
                background: "#146c2e",
                color: "#fff",
                fontSize: "11px",
                fontWeight: 700,
                cursor: "pointer",
              }}
            >
              ↓
            </button>
          )}
        </div>
      </div>
      {photo.status === "error" && (
        <p style={{ fontSize: "10px", color: "#c0392b", margin: "0 12px 8px" }}>
          {photo.error}
        </p>
      )}
    </div>
  );
}

function Spin() {
  return (
    <span
      style={{
        display: "inline-block",
        width: "12px",
        height: "12px",
        border: "2px solid rgba(255,255,255,0.35)",
        borderTopColor: "#fff",
        borderRadius: "50%",
        animation: "spin 0.8s linear infinite",
      }}
    />
  );
}

function btn(bg, border, color) {
  return {
    height: "34px",
    padding: "0 16px",
    borderRadius: "7px",
    border: `1px solid ${border}`,
    background: bg,
    fontSize: "12px",
    color,
    cursor: "pointer",
  };
}

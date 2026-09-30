/**
 * Fotostudio — puts a cut-out car into a showroom scene.
 *
 * The car's pixels are never changed (apart from an optional, very light
 * "Licht angleichen"). Realism comes from what is drawn around it:
 *   - a tight contact shadow where the tyres touch the floor,
 *   - a soft ambient shadow under the whole car,
 *   - a faint mirror reflection on polished floors.
 * Everything is plain <canvas>, so it works in every browser.
 */

/* ------------------------------------------------------------ formats */

export const FORMATS = [
  { id: "4:3", label: "4:3 · mobile.de", width: 1600, height: 1200 },
  { id: "16:9", label: "16:9 · Breitbild", width: 1920, height: 1080 },
];

/* ------------------------------------------------------------ scenes */

/**
 * kind "photo": a showroom photo. floorY = where the tyres stand and carWidth
 * = car width, both as a share of the photo (so the car keeps its size in the
 * room in every format).
 * kind "studio": painted in the browser; values are shares of the output.
 */
export const SCENES = [
  {
    id: "showroom-hell",
    label: "Showroom Hell",
    hint: "Autogalerie Jülich · heller Showroom",
    kind: "photo",
    src: "/showroom3.png",
    floorY: 0.905,
    carWidth: 0.5,
    reflection: 0.14,
    shadow: 0.9,
    tone: [236, 234, 228],
  },
  {
    id: "showroom-lounge",
    label: "Showroom Lounge",
    hint: "Autogalerie Jülich · dunkle Wand",
    kind: "photo",
    src: "/showroom.png",
    floorY: 0.9,
    carWidth: 0.6,
    reflection: 0.06,
    shadow: 1,
    tone: [118, 114, 108],
  },
  {
    id: "studio-weiss",
    label: "Studio Weiß",
    hint: "Heller Studiohintergrund",
    kind: "studio",
    floorY: 0.84,
    carWidth: 0.7,
    reflection: 0.06,
    shadow: 0.85,
    tone: [240, 241, 242],
  },
  {
    id: "studio-grau",
    label: "Studio Grau",
    hint: "Neutral mit Spotlicht",
    kind: "studio",
    floorY: 0.84,
    carWidth: 0.7,
    reflection: 0.1,
    shadow: 0.9,
    tone: [176, 180, 185],
  },
  {
    id: "studio-anthrazit",
    label: "Studio Anthrazit",
    hint: "Premium, dunkel",
    kind: "studio",
    floorY: 0.84,
    carWidth: 0.7,
    reflection: 0.16,
    shadow: 1,
    tone: [70, 76, 84],
  },
];

export const CUSTOM_SCENE = {
  id: "custom",
  label: "Eigenes Bild",
  hint: "Eigener Hintergrund",
  kind: "photo",
  floorY: 0.88,
  carWidth: 0.55,
  reflection: 0,
  shadow: 0.9,
  tone: [128, 128, 128],
};

/* ------------------------------------------------------------ helpers */

function makeCanvas(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

/**
 * Soft blur that works everywhere (Safari has no ctx.filter): shrink, then
 * scale back up with smoothing. `amount` ≈ blur radius in pixels.
 */
function softBlur(source, amount) {
  const factor = Math.max(1, amount / 2);
  const small = makeCanvas(source.width / factor, source.height / factor);
  const sctx = small.getContext("2d");
  sctx.imageSmoothingQuality = "high";
  sctx.drawImage(source, 0, 0, small.width, small.height);
  // A second pass hides the blocky look of a single down/up scale.
  const smaller = makeCanvas(small.width / 2, small.height / 2);
  smaller.getContext("2d").drawImage(small, 0, 0, smaller.width, smaller.height);
  sctx.clearRect(0, 0, small.width, small.height);
  sctx.drawImage(smaller, 0, 0, small.width, small.height);
  const out = makeCanvas(source.width, source.height);
  const octx = out.getContext("2d");
  octx.imageSmoothingQuality = "high";
  octx.drawImage(small, 0, 0, out.width, out.height);
  return out;
}

export function loadImage(src) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.decoding = "async";
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Bild konnte nicht geladen werden"));
    img.src = src;
  });
}

/**
 * Trims the empty border of a cut-out and remembers where the car really is.
 * Returns { canvas, width, height } of just the car.
 */
export function trimCutout(img) {
  const full = makeCanvas(img.naturalWidth || img.width, img.naturalHeight || img.height);
  const ctx = full.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const { data, width, height } = ctx.getImageData(0, 0, full.width, full.height);
  let top = height;
  let bottom = -1;
  let left = width;
  let right = -1;
  for (let y = 0; y < height; y += 1) {
    const row = y * width * 4;
    for (let x = 0; x < width; x += 1) {
      if (data[row + x * 4 + 3] > 24) {
        if (y < top) top = y;
        if (y > bottom) bottom = y;
        if (x < left) left = x;
        if (x > right) right = x;
      }
    }
  }
  if (bottom < 0) throw new Error("Auf dem Bild wurde kein Fahrzeug gefunden.");
  const car = makeCanvas(right - left + 1, bottom - top + 1);
  const cctx = car.getContext("2d", { willReadFrequently: true });
  cctx.drawImage(full, left, top, car.width, car.height, 0, 0, car.width, car.height);
  defringe(cctx, car.width, car.height);

  // Lowest solid pixel of every column (tyres, bumpers, sills) …
  const contour = new Float32Array(car.width).fill(NaN);
  for (let x = left; x <= right; x += 1) {
    for (let y = bottom; y >= top; y -= 1) {
      if (data[(y * width + x) * 4 + 3] > 128) {
        contour[x - left] = y - top;
        break;
      }
    }
  }
  // … and the floor line under the car: the lower hull of that contour. It
  // touches the tyres and bridges under the body, so each wheel gets its
  // shadow and reflection where it really stands.
  return { canvas: car, width: car.width, height: car.height, contour, ground: lowerHull(contour, car.height) };
}

/**
 * Pulls the soft edge in by one pixel, so no light rim of the old
 * background stays around the car.
 */
function defringe(ctx, w, h) {
  const img = ctx.getImageData(0, 0, w, h);
  const d = img.data;
  const alpha = new Uint8ClampedArray(w * h);
  for (let i = 0; i < w * h; i += 1) alpha[i] = d[i * 4 + 3];
  for (let y = 1; y < h - 1; y += 1) {
    for (let x = 1; x < w - 1; x += 1) {
      const i = y * w + x;
      const a = alpha[i];
      if (a === 0 || a === 255 && alpha[i - 1] === 255 && alpha[i + 1] === 255 && alpha[i - w] === 255 && alpha[i + w] === 255) continue;
      d[i * 4 + 3] = Math.min(a, alpha[i - 1], alpha[i + 1], alpha[i - w], alpha[i + w]);
    }
  }
  ctx.putImageData(img, 0, 0);
}

/** Lower convex hull of the contour, as one y value per column. */
function lowerHull(contour, height) {
  const points = [];
  for (let x = 0; x < contour.length; x += 1) {
    if (!Number.isNaN(contour[x])) points.push([x, contour[x]]);
  }
  const ground = new Float32Array(contour.length).fill(height - 1);
  if (points.length < 2) return ground;
  // y grows downwards, so the floor is the "upper" hull in maths terms.
  const hull = [];
  for (const p of points) {
    while (hull.length >= 2) {
      const [ax, ay] = hull[hull.length - 2];
      const [bx, by] = hull[hull.length - 1];
      const cross = (bx - ax) * (p[1] - ay) - (by - ay) * (p[0] - ax);
      if (cross <= 0) hull.pop();
      else break;
    }
    hull.push(p);
  }
  // Only the points that stand on the floor (tyres, low bumpers) define it;
  // the car's side corners at the very left/right do not.
  const lowest = Math.max(...hull.map((p) => p[1]));
  let support = hull.filter((p) => p[1] >= lowest - height * 0.22);
  if (support.length < 2) support = [hull[0], hull[hull.length - 1]].sort((a, b) => a[0] - b[0]);
  const at = (a, b, x) => a[1] + ((b[1] - a[1]) * (x - a[0])) / Math.max(1, b[0] - a[0]);
  for (let x = 0; x < ground.length; x += 1) {
    let i = 0;
    while (i < support.length - 2 && x > support[i + 1][0]) i += 1;
    // inside: between two support points; outside: the nearest segment, extended
    const y = at(support[i], support[i + 1], x);
    ground[x] = Math.min(height - 1 + height * 0.05, Math.max(lowest - height * 0.3, y));
  }
  return ground;
}

/** Where the scene photo lands in the output (cover, centred). */
function coverRect(imgW, imgH, outW, outH) {
  const scale = Math.max(outW / imgW, outH / imgH);
  const w = imgW * scale;
  const h = imgH * scale;
  return { x: (outW - w) / 2, y: (outH - h) / 2, w, h, scale };
}

/* ------------------------------------------------------------ studio backdrops */

function addGrain(ctx, W, H, strength) {
  // Fine noise hides gradient banding, as in a real photo.
  const tile = makeCanvas(256, 256);
  const tctx = tile.getContext("2d");
  const img = tctx.createImageData(256, 256);
  let seed = 7;
  for (let i = 0; i < img.data.length; i += 4) {
    seed = (seed * 16807) % 2147483647;
    const v = (seed % 255) | 0;
    img.data[i] = v;
    img.data[i + 1] = v;
    img.data[i + 2] = v;
    img.data[i + 3] = 255;
  }
  tctx.putImageData(img, 0, 0);
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.globalCompositeOperation = "overlay";
  ctx.fillStyle = ctx.createPattern(tile, "repeat");
  ctx.fillRect(0, 0, W, H);
  ctx.restore();
}

/** An infinity cove: wall that bends softly into the floor, with a spotlight. */
function paintStudio(ctx, W, H, look) {
  const horizon = H * 0.6;

  // wall
  const wall = ctx.createLinearGradient(0, 0, 0, horizon);
  wall.addColorStop(0, look.wallTop);
  wall.addColorStop(1, look.wallBottom);
  ctx.fillStyle = wall;
  ctx.fillRect(0, 0, W, horizon);

  // floor
  const floor = ctx.createLinearGradient(0, horizon, 0, H);
  floor.addColorStop(0, look.floorFar);
  floor.addColorStop(1, look.floorNear);
  ctx.fillStyle = floor;
  ctx.fillRect(0, horizon, W, H - horizon);

  // soft bend between wall and floor (no hard line)
  const bend = ctx.createLinearGradient(0, horizon - H * 0.09, 0, horizon + H * 0.09);
  bend.addColorStop(0, "rgba(0,0,0,0)");
  bend.addColorStop(0.5, look.bend);
  bend.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = bend;
  ctx.fillRect(0, horizon - H * 0.09, W, H * 0.18);

  // spotlight on the wall behind the car
  const spot = ctx.createRadialGradient(W / 2, horizon * 0.72, 0, W / 2, horizon * 0.72, W * 0.55);
  spot.addColorStop(0, look.spot);
  spot.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = spot;
  ctx.fillRect(0, 0, W, H);

  // pool of light on the floor
  ctx.save();
  ctx.translate(W / 2, H * 0.84);
  ctx.scale(1, 0.22);
  const pool = ctx.createRadialGradient(0, 0, 0, 0, 0, W * 0.5);
  pool.addColorStop(0, look.pool);
  pool.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = pool;
  ctx.fillRect(-W, -W, W * 2, W * 2);
  ctx.restore();

  // overhead light strip (dark studio)
  if (look.strip) {
    const strip = ctx.createLinearGradient(0, 0, 0, H * 0.1);
    strip.addColorStop(0, look.strip);
    strip.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = strip;
    ctx.fillRect(W * 0.12, 0, W * 0.76, H * 0.1);
  }

  // vignette
  const vignette = ctx.createRadialGradient(W / 2, H * 0.55, Math.min(W, H) * 0.35, W / 2, H * 0.55, Math.max(W, H) * 0.78);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, look.vignette);
  ctx.fillStyle = vignette;
  ctx.fillRect(0, 0, W, H);

  addGrain(ctx, W, H, 0.035);
}

const STUDIO_LOOKS = {
  "studio-weiss": {
    wallTop: "#e6e8eb",
    wallBottom: "#f8f8f9",
    floorFar: "#f8f8f9",
    floorNear: "#e3e5e8",
    bend: "rgba(255,255,255,0)",
    spot: "rgba(255,255,255,0.75)",
    pool: "rgba(255,255,255,0.6)",
    vignette: "rgba(70,78,88,0.22)",
  },
  "studio-grau": {
    wallTop: "#8f949a",
    wallBottom: "#b4b8bd",
    floorFar: "#b4b8bd",
    floorNear: "#80858b",
    bend: "rgba(210,214,218,0)",
    spot: "rgba(240,242,245,0.55)",
    pool: "rgba(235,238,241,0.35)",
    vignette: "rgba(20,24,28,0.45)",
  },
  "studio-anthrazit": {
    wallTop: "#15181c",
    wallBottom: "#2a2f35",
    floorFar: "#2a2f35",
    floorNear: "#101316",
    bend: "rgba(90,98,108,0)",
    spot: "rgba(150,160,172,0.32)",
    pool: "rgba(140,150,162,0.18)",
    vignette: "rgba(0,0,0,0.6)",
  },
};

/* ------------------------------------------------------------ scene */

/**
 * Draws the background and tells where the car should stand by default.
 * Returns { floorY, defaultWidth } in output pixels.
 */
export function drawScene(ctx, scene, W, H, bgImage) {
  if (scene.kind === "studio") {
    paintStudio(ctx, W, H, STUDIO_LOOKS[scene.id] || STUDIO_LOOKS["studio-weiss"]);
    return { floorY: H * scene.floorY, defaultWidth: W * scene.carWidth };
  }
  if (!bgImage) {
    ctx.fillStyle = "#e5e7ea";
    ctx.fillRect(0, 0, W, H);
    return { floorY: H * scene.floorY, defaultWidth: W * scene.carWidth };
  }
  const rect = coverRect(bgImage.naturalWidth, bgImage.naturalHeight, W, H);
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bgImage, rect.x, rect.y, rect.w, rect.h);
  const floorY = Math.min(H * 0.97, rect.y + rect.h * scene.floorY);
  const defaultWidth = Math.min(W * 0.9, rect.w * scene.carWidth);
  return { floorY, defaultWidth };
}

/* ------------------------------------------------------------ car + shadows */

/**
 * Shadows along the floor line under the car:
 *   - under the body: the floor between the tyres is in the car's shade,
 *   - contact: dark and tight where tyres and bumpers meet the floor,
 *   - ambient: wide and soft, a little beyond the car.
 */
function drawShadows(ctx, car, box, strength) {
  if (strength <= 0) return;
  const k = box.h / car.height;
  const pad = Math.round(box.w * 0.1);
  const top = Math.min(...Array.from(car.ground)) * k - box.h * 0.12;
  const layerH = box.h - top + box.h * 0.12;
  const make = () => makeCanvas(box.w + pad * 2, layerH);
  const Y = (v) => v * k - top; // car row -> layer row
  const step = Math.max(1, Math.floor(car.width / 480));
  const colW = step * k + 1;

  // under the body
  const body = make();
  const bctx = body.getContext("2d");
  bctx.fillStyle = "#000";
  for (let x = 0; x < car.width; x += step) {
    const c = car.contour[x];
    if (Number.isNaN(c)) continue;
    const g = car.ground[x];
    // a thin band on the floor under the car (not up to the bumper)
    const y0 = Y(g - car.height * 0.06);
    const y1 = Y(g) + box.h * 0.025;
    bctx.globalAlpha = 0.85;
    bctx.fillRect(pad + x * k, y0, colW, y1 - y0);
  }
  const bodySoft = softBlur(body, Math.max(6, box.w * 0.018));

  // contact: only where the car nearly touches the floor
  const contact = make();
  const cctx = contact.getContext("2d");
  cctx.fillStyle = "#000";
  const near = car.height * 0.05;
  for (let x = 0; x < car.width; x += step) {
    const c = car.contour[x];
    if (Number.isNaN(c)) continue;
    const g = car.ground[x];
    const touch = Math.max(0, 1 - (g - c) / near);
    if (touch <= 0) continue;
    cctx.globalAlpha = touch;
    cctx.fillRect(pad + x * k, Y(g) - box.h * 0.012, colW, box.h * 0.03);
  }
  const contactSoft = softBlur(contact, Math.max(3, box.w * 0.007));

  // ambient: a soft band along the whole floor line
  const ambient = make();
  const actx = ambient.getContext("2d");
  actx.fillStyle = "#000";
  actx.beginPath();
  const inset = car.width * 0.04; // stay inside the car's width; the blur spreads it
  actx.moveTo(pad + inset * k, Y(car.ground[Math.round(inset)]));
  for (let x = Math.round(inset); x < car.width - inset; x += step) actx.lineTo(pad + x * k, Y(car.ground[x]) - box.h * 0.04);
  actx.lineTo(pad + (car.width - inset) * k, Y(car.ground[Math.round(car.width - inset) - 1]));
  for (let x = Math.round(car.width - inset) - 1; x >= inset; x -= step) actx.lineTo(pad + x * k, Y(car.ground[x]) + box.h * 0.045);
  actx.closePath();
  actx.globalAlpha = 0.7;
  actx.fill();
  const ambientSoft = softBlur(ambient, Math.max(10, box.w * 0.045));

  const x = box.x - pad;
  const y = box.y + top;
  ctx.save();
  ctx.globalAlpha = Math.min(1, 0.6 * strength);
  ctx.drawImage(ambientSoft, x, y);
  ctx.globalAlpha = Math.min(1, 0.8 * strength);
  ctx.drawImage(bodySoft, x, y);
  ctx.globalAlpha = Math.min(1, 1 * strength);
  ctx.drawImage(contactSoft, x, y);
  ctx.restore();
}

/**
 * Mirror image on polished floors: every column is mirrored at the floor
 * point under it, so each tyre meets its own reflection.
 */
function drawReflection(ctx, car, box, strength) {
  if (strength <= 0) return;
  const k = box.h / car.height;
  const groundTop = Math.min(...Array.from(car.ground)) * k;
  const depth = box.h * 0.55;
  const layer = makeCanvas(box.w, box.h - groundTop + depth);
  const lctx = layer.getContext("2d");
  lctx.imageSmoothingQuality = "high";
  const step = Math.max(1, Math.floor(car.width / 600));
  for (let x = 0; x < car.width; x += step) {
    const g = car.ground[x] * k - groundTop; // floor row in the layer
    const sw = Math.min(step, car.width - x);
    // mirror at the floor row g:  y' = 2g - (y·k - groundTop)
    lctx.setTransform(1, 0, 0, -1, 0, 2 * g + groundTop);
    lctx.drawImage(car.canvas, x, 0, sw, car.height, x * k, 0, sw * k + 0.6, box.h);
  }
  lctx.setTransform(1, 0, 0, 1, 0, 0);
  lctx.globalCompositeOperation = "destination-in";
  const fade = lctx.createLinearGradient(0, 0, 0, layer.height);
  fade.addColorStop(0, "rgba(0,0,0,0.9)");
  fade.addColorStop(0.35, "rgba(0,0,0,0.35)");
  fade.addColorStop(1, "rgba(0,0,0,0)");
  lctx.fillStyle = fade;
  lctx.fillRect(0, 0, layer.width, layer.height);
  const soft = softBlur(layer, 2);
  ctx.save();
  ctx.globalAlpha = strength;
  ctx.drawImage(soft, box.x, box.y + groundTop);
  ctx.restore();
}

/* ------------------------------------------------------------ compose */

/**
 * Renders one photo.
 * settings: { scale (1 = scene default), offsetX, offsetY (share of output),
 *             shadow (0–1.5), reflection (0–1.5), harmonize (bool) }
 * Returns the car's box (for dragging).
 */
export function compose(canvas, { car, scene, bgImage, format, settings }) {
  const W = format.width;
  const H = format.height;
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  ctx.clearRect(0, 0, W, H);

  const { floorY, defaultWidth } = drawScene(ctx, scene, W, H, bgImage);
  if (!car) return null;

  // Size: scene default, never taller than 62 % or wider than 96 % of the frame.
  let w = defaultWidth * (settings.scale || 1);
  let h = (car.height / car.width) * w;
  const maxH = H * 0.62;
  if (h > maxH) {
    w *= maxH / h;
    h = maxH;
  }
  if (w > W * 0.96) {
    h *= (W * 0.96) / w;
    w = W * 0.96;
  }
  const box = {
    w,
    h,
    x: (W - w) / 2 + (settings.offsetX || 0) * W,
    y: floorY - h + (settings.offsetY || 0) * H,
  };

  drawReflection(ctx, car, box, scene.reflection * (settings.reflection ?? 1));
  drawShadows(ctx, car, box, scene.shadow * (settings.shadow ?? 1));

  // The car itself — unchanged pixels.
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(car.canvas, box.x, box.y, box.w, box.h);

  // Optional: a breath of the room's light on the car (6 %).
  if (settings.harmonize) {
    const tint = makeCanvas(box.w, box.h);
    const tctx = tint.getContext("2d");
    tctx.drawImage(car.canvas, 0, 0, box.w, box.h);
    tctx.globalCompositeOperation = "source-in";
    tctx.fillStyle = `rgb(${scene.tone.join(",")})`;
    tctx.fillRect(0, 0, box.w, box.h);
    ctx.save();
    ctx.globalAlpha = 0.06;
    ctx.globalCompositeOperation = "soft-light";
    ctx.drawImage(tint, box.x, box.y);
    ctx.restore();
  }

  return box;
}

/** Small preview of a scene for the picker. */
export function sceneThumb(scene, bgImage, width = 240, height = 180) {
  const canvas = makeCanvas(width, height);
  drawScene(canvas.getContext("2d"), scene, width, height, bgImage);
  return canvas.toDataURL("image/jpeg", 0.85);
}

/**
 * Shrinks a phone photo before upload (servers limit the upload size; the
 * cut-out does not need more than ~2000 px).
 */
export async function shrinkForUpload(file, maxSide = 2000) {
  const url = URL.createObjectURL(file);
  try {
    const img = await loadImage(url);
    const scale = Math.min(1, maxSide / Math.max(img.naturalWidth, img.naturalHeight));
    if (scale === 1 && file.size < 3_500_000) return file;
    const canvas = makeCanvas(img.naturalWidth * scale, img.naturalHeight * scale);
    const ctx = canvas.getContext("2d");
    ctx.imageSmoothingQuality = "high";
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.92));
    return new File([blob], file.name.replace(/\.[^.]+$/, "") + ".jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}

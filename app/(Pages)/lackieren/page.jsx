"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { toast } from "react-hot-toast";
import {
  FiRotateCw,
  FiTrash2,
  FiX,
  FiSave,
  FiPrinter,
  FiCrosshair,
  FiMaximize,
  FiTarget,
  FiChevronDown,
  FiAlertCircle,
  FiMinus,
  FiPlus,
} from "react-icons/fi";

/* =========================================================
   3D VEHICLE MODEL  (served from /public)
========================================================= */
const MODEL_URL = "/uploads_files_5489305_Glk.glb";

const DAMAGE_TYPES = [
  { id: "scratch", label: "Kratzer", color: "#0ea5e9" },
  { id: "dent", label: "Delle", color: "#f59e0b" },
  { id: "paint", label: "Lackschaden", color: "#ef4444" },
  { id: "rust", label: "Rost", color: "#a16207" },
  { id: "crack", label: "Riss / Bruch", color: "#7c3aed" },
  { id: "other", label: "Sonstiges", color: "#475569" },
];

const ACTIONS = [
  "Spachteln",
  "Schleifen",
  "Grundieren",
  "Lackieren",
  "Polieren",
  "Beule ausbeulen",
  "Teil tauschen",
];

const SEVERITY = [
  { id: "low", label: "Leicht", color: "#22c55e" },
  { id: "mid", label: "Mittel", color: "#f59e0b" },
  { id: "high", label: "Schwer", color: "#ef4444" },
];

const PANELS = [
  "Motorhaube",
  "Dach",
  "Heckklappe / Kofferraum",
  "Stoßstange vorne",
  "Stoßstange hinten",
  "Kotflügel vorne links",
  "Kotflügel vorne rechts",
  "Kotflügel hinten links",
  "Kotflügel hinten rechts",
  "Tür vorne links",
  "Tür vorne rechts",
  "Tür hinten links",
  "Tür hinten rechts",
  "Schweller links",
  "Schweller rechts",
  "Spiegel",
  "Felge",
];

const makeMark = (local, normal, type) => ({
  id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  local, // [x,y,z] on the car (car-local space)
  normal, // surface normal at the hit (car-local space)
  type,
  action: "Lackieren",
  severity: "mid",
  panel: "",
  note: "",
  size: 0.18, // decal radius in car-local units (user adjustable)
  rotation: 0, // decal spin in radians (e.g. scratch direction)
});

export default function VehicleInspection3DPage() {
  const [ready, setReady] = useState(false);
  const [errored, setErrored] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Szene wird vorbereitet");

  const [marks, setMarks] = useState([]);
  const [activeType, setActiveType] = useState("scratch");
  const [selectedMark, setSelectedMark] = useState(null);
  const [placing, setPlacing] = useState(true);
  const [autoSpin, setAutoSpin] = useState(true);
  const [carInfo, setCarInfo] = useState({ carName: "", finNumber: "" });

  const mountRef = useRef(null);
  const three = useRef({});
  const stateRef = useRef({});
  stateRef.current = { autoSpin, placing, activeType };
  const marksRef = useRef([]);
  marksRef.current = marks;

  /* =========================================================
     THREE.JS
  ========================================================= */
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};

    (async () => {
      try {
        const THREE = await import(
          /* webpackIgnore: true */ "https://esm.sh/three@0.160.0"
        );
        const { OrbitControls } = await import(
          /* webpackIgnore: true */ "https://esm.sh/three@0.160.0/examples/jsm/controls/OrbitControls.js"
        );
        const { GLTFLoader } = await import(
          /* webpackIgnore: true */ "https://esm.sh/three@0.160.0/examples/jsm/loaders/GLTFLoader.js"
        );
        const { RoomEnvironment } = await import(
          /* webpackIgnore: true */ "https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js"
        );
        if (disposed) return;

        const mount = mountRef.current;
        const width = mount.clientWidth;
        const height = mount.clientHeight;

        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(
          40,
          width / height,
          0.1,
          1000,
        );
        camera.position.set(5.4, 2.5, 6.4);

        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(width, height);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        renderer.toneMappingExposure = 1.0;
        mount.appendChild(renderer.domElement);

        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(
          new RoomEnvironment(),
          0.04,
        ).texture;

        scene.add(new THREE.HemisphereLight(0xffffff, 0xe2e8f0, 0.55));
        const key = new THREE.DirectionalLight(0xffffff, 2.1);
        key.position.set(6, 10, 6);
        key.castShadow = true;
        key.shadow.mapSize.set(2048, 2048);
        key.shadow.bias = -0.0005;
        Object.assign(key.shadow.camera, {
          near: 1,
          far: 40,
          left: -10,
          right: 10,
          top: 10,
          bottom: -10,
        });
        scene.add(key);
        const fill = new THREE.DirectionalLight(0xffffff, 0.45);
        fill.position.set(-7, 5, -5);
        scene.add(fill);

        const floor = new THREE.Mesh(
          new THREE.CircleGeometry(16, 80),
          new THREE.MeshStandardMaterial({
            color: 0xeef2f7,
            roughness: 0.92,
            metalness: 0,
          }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);

        const ring = new THREE.Mesh(
          new THREE.RingGeometry(2.95, 3.0, 80),
          new THREE.MeshBasicMaterial({
            color: 0x2563eb,
            transparent: true,
            opacity: 0.3,
            side: THREE.DoubleSide,
          }),
        );
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = 0.004;
        scene.add(ring);

        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enableDamping = true;
        controls.dampingFactor = 0.07;
        controls.minDistance = 2.0;
        controls.maxDistance = 14;
        controls.maxPolarAngle = Math.PI / 2.02;
        controls.target.set(0, 0.65, 0);

        const carGroup = new THREE.Group();
        scene.add(carGroup);
        const decalGroup = new THREE.Group(); // holds the realistic damage decals
        carGroup.add(decalGroup);

        const raycaster = new THREE.Raycaster();
        const pointer = new THREE.Vector2();

        const fly = {
          active: false,
          t: 0,
          dur: 0.9,
          fromCam: new THREE.Vector3(),
          toCam: new THREE.Vector3(),
          fromTgt: new THREE.Vector3(),
          toTgt: new THREE.Vector3(),
        };

        // pre-build damage textures once
        const textures = buildDamageTextures(THREE);

        three.current = {
          THREE,
          scene,
          camera,
          renderer,
          controls,
          pmrem,
          carGroup,
          decalGroup,
          raycaster,
          pointer,
          carMeshes: [],
          fly,
          textures,
        };

        const finishCar = () => {
          const box = new THREE.Box3().setFromObject(carGroup);
          const size = new THREE.Vector3();
          box.getSize(size);
          const maxDim = Math.max(size.x, size.y, size.z) || 1;
          carGroup.scale.setScalar(3.7 / maxDim);

          const box2 = new THREE.Box3().setFromObject(carGroup);
          const c2 = new THREE.Vector3();
          box2.getCenter(c2);
          carGroup.position.x -= c2.x;
          carGroup.position.z -= c2.z;
          carGroup.position.y -= box2.min.y;

          carGroup.traverse((o) => {
            if (o.isMesh) {
              o.castShadow = true;
              o.receiveShadow = true;
              three.current.carMeshes.push(o);
            }
          });
          setReady(true);
        };

        setLoadingMsg("Fahrzeugmodell wird geladen");
        new GLTFLoader().load(
          MODEL_URL,
          (gltf) => {
            if (!disposed) {
              carGroup.add(gltf.scene);
              finishCar();
            }
          },
          (xhr) => {
            if (xhr.total)
              setLoadingMsg(
                `Modell ${Math.round((xhr.loaded / xhr.total) * 100)}%`,
              );
          },
          (err) => {
            console.error(err);
            setErrored(true);
            setLoadingMsg("Modell konnte nicht geladen werden.");
            toast.error("Fahrzeugmodell konnte nicht geladen werden.");
          },
        );

        const onResize = () => {
          const w = mount.clientWidth,
            h = mount.clientHeight;
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        };
        window.addEventListener("resize", onResize);

        const easeInOut = (x) =>
          x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
        const clock = new THREE.Clock();
        let raf;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          const dt = clock.getDelta();
          if (fly.active) {
            fly.t += dt / fly.dur;
            const k = easeInOut(Math.min(fly.t, 1));
            camera.position.lerpVectors(fly.fromCam, fly.toCam, k);
            controls.target.lerpVectors(fly.fromTgt, fly.toTgt, k);
            if (fly.t >= 1) fly.active = false;
          } else if (stateRef.current.autoSpin) {
            carGroup.rotation.y += 0.0036;
          }
          controls.update();
          renderer.render(scene, camera);
        };
        tick();

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("resize", onResize);
          controls.dispose();
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.parentNode?.removeChild(renderer.domElement);
        };
      } catch (err) {
        console.error(err);
        setErrored(true);
        setLoadingMsg("3D ist in diesem Browser nicht verfügbar.");
        toast.error("WebGL wird nicht unterstützt.");
      }
    })();

    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  /* =========================================================
     SYNC marks -> realistic decals on the car surface
  ========================================================= */
  useEffect(() => {
    const t = three.current;
    if (!t.decalGroup || !t.THREE) return;
    const { THREE, decalGroup, textures, camera } = t;

    while (decalGroup.children.length) {
      const c = decalGroup.children.pop();
      c.geometry?.dispose?.();
      if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose?.());
      else c.material?.dispose?.();
    }

    marks.forEach((m, idx) => {
      const type = DAMAGE_TYPES.find((x) => x.id === m.type);
      const isSel = m.id === selectedMark;
      const pos = new THREE.Vector3(...m.local);
      const nrm = new THREE.Vector3(...(m.normal || [0, 0, 1])).normalize();

      // ---- the realistic damage decal: a small plane hugging the surface,
      //      textured to look like that exact damage type ----
      const planeGeo = new THREE.PlaneGeometry(m.size * 2, m.size * 2);
      const planeMat = new THREE.MeshBasicMaterial({
        map: textures[m.type] || textures.other,
        transparent: true,
        depthTest: true,
        depthWrite: false,
        polygonOffset: true,
        polygonOffsetFactor: -4,
        opacity: 0.95,
      });
      const decal = new THREE.Mesh(planeGeo, planeMat);
      decal.position.copy(pos).add(nrm.clone().multiplyScalar(0.012)); // float just above metal
      // orient the plane so its +Z faces along the surface normal
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        nrm,
      );
      decal.quaternion.copy(quat);
      decal.rotateZ(m.rotation || 0);
      decal.userData.markId = m.id;
      decal.renderOrder = 10;
      decalGroup.add(decal);

      // ---- selection / locate ring (only when selected) ----
      if (isSel) {
        const selRing = new THREE.Mesh(
          new THREE.RingGeometry(m.size * 1.15, m.size * 1.32, 40),
          new THREE.MeshBasicMaterial({
            color: type?.color || "#111",
            transparent: true,
            opacity: 0.95,
            side: THREE.DoubleSide,
            depthTest: false,
          }),
        );
        selRing.position.copy(pos).add(nrm.clone().multiplyScalar(0.014));
        selRing.quaternion.copy(quat);
        selRing.renderOrder = 12;
        decalGroup.add(selRing);
      }

      // ---- tiny number bead so the list <-> car mapping is clear ----
      const beadCanvas = numberBead(idx + 1, type?.color || "#111");
      const beadTex = new THREE.CanvasTexture(beadCanvas);
      const bead = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: beadTex,
          depthTest: false,
          transparent: true,
        }),
      );
      const beadScale = Math.max(0.16, m.size * 0.9);
      bead.scale.set(beadScale, beadScale, 1);
      bead.position
        .copy(pos)
        .add(nrm.clone().multiplyScalar(0.02))
        .add(new THREE.Vector3(0, m.size + 0.12, 0));
      bead.userData.markId = m.id;
      bead.renderOrder = 20;
      decalGroup.add(bead);
    });
  }, [marks, selectedMark, ready]);

  /* fly camera to a mark */
  const flyToMark = useCallback((mark) => {
    const t = three.current;
    if (!t.camera || !mark) return;
    const { THREE, carGroup, camera, controls, fly } = t;
    const world = carGroup.localToWorld(new THREE.Vector3(...mark.local));
    const center = new THREE.Vector3(0, world.y, 0);
    const dir = world.clone().sub(center);
    dir.y = 0;
    if (dir.lengthSq() < 1e-4) dir.set(1, 0, 1);
    dir.normalize();
    const dist = 1.4 + mark.size * 6; // closer for small damage, wider for big
    const camPos = world
      .clone()
      .add(dir.multiplyScalar(dist))
      .add(new THREE.Vector3(0, 0.8, 0));
    fly.fromCam.copy(camera.position);
    fly.toCam.copy(camPos);
    fly.fromTgt.copy(controls.target);
    fly.toTgt.copy(world);
    fly.t = 0;
    fly.active = true;
    setAutoSpin(false);
  }, []);

  /* click -> place / select (captures surface normal too) */
  const handleCanvasClick = useCallback(
    (e) => {
      const t = three.current;
      if (!t.raycaster || !t.carMeshes?.length) return;
      const s = stateRef.current;
      const rect = t.renderer.domElement.getBoundingClientRect();
      t.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      t.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      t.raycaster.setFromCamera(t.pointer, t.camera);

      const decalHits = t.raycaster.intersectObjects(
        t.decalGroup.children,
        false,
      );
      const hitDecal = decalHits.find((h) => h.object.userData.markId);
      if (hitDecal) {
        const id = hitDecal.object.userData.markId;
        setSelectedMark(id);
        const m = marksRef.current.find((x) => x.id === id);
        if (m) flyToMark(m);
        return;
      }

      if (!s.placing) return;

      const hits = t.raycaster.intersectObjects(t.carMeshes, true);
      if (hits.length) {
        const hit = hits[0];
        const localPt = t.carGroup.worldToLocal(hit.point.clone());

        // surface normal in car-local space
        let nrmLocal = [0, 0, 1];
        if (hit.face) {
          const nWorld = hit.face.normal
            .clone()
            .transformDirection(hit.object.matrixWorld);
          // bring into carGroup local space (rotation only)
          const inv = new t.THREE.Matrix3()
            .getNormalMatrix(t.carGroup.matrixWorld)
            .invert();
          const nLocalV = nWorld.applyMatrix3(inv).normalize();
          nrmLocal = [nLocalV.x, nLocalV.y, nLocalV.z];
        }

        const mk = makeMark(
          [localPt.x, localPt.y, localPt.z],
          nrmLocal,
          s.activeType,
        );
        setMarks((prev) => [...prev, mk]);
        setSelectedMark(mk.id);
        setAutoSpin(false);
      }
    },
    [flyToMark],
  );

  useEffect(() => {
    const t = three.current;
    if (!ready || !t.renderer) return;
    const el = t.renderer.domElement;
    let down = null;
    const onDown = (e) => (down = [e.clientX, e.clientY]);
    const onUp = (e) => {
      if (!down) return;
      const moved =
        Math.abs(e.clientX - down[0]) + Math.abs(e.clientY - down[1]);
      if (moved < 6) handleCanvasClick(e);
      down = null;
    };
    el.addEventListener("pointerdown", onDown);
    el.addEventListener("pointerup", onUp);
    return () => {
      el.removeEventListener("pointerdown", onDown);
      el.removeEventListener("pointerup", onUp);
    };
  }, [ready, handleCanvasClick]);

  const resetView = () => {
    const t = three.current;
    if (!t.camera) return;
    const { fly, camera, controls } = t;
    fly.fromCam.copy(camera.position);
    fly.toCam.set(5.4, 2.5, 6.4);
    fly.fromTgt.copy(controls.target);
    fly.toTgt.set(0, 0.65, 0);
    fly.t = 0;
    fly.active = true;
  };

  const updateMark = (id, patch) =>
    setMarks((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const deleteMark = (id) => {
    setMarks((prev) => prev.filter((m) => m.id !== id));
    if (selectedMark === id) setSelectedMark(null);
  };
  const clearAll = () => {
    if (marks.length && confirm("Alle Markierungen entfernen?")) {
      setMarks([]);
      setSelectedMark(null);
    }
  };
  const selectMark = (id) => {
    setSelectedMark(id);
    const m = marks.find((x) => x.id === id);
    if (m) flyToMark(m);
  };

  const handleSave = async () => {
    const payload = {
      carName: carInfo.carName,
      finNumber: carInfo.finNumber,
      marks: marks.map(({ id, ...r }) => r),
    };
    try {
      console.log("Inspection payload:", payload);
      toast.success("Auftrag gespeichert (siehe Konsole)");
    } catch {
      toast.error("Speichern fehlgeschlagen");
    }
  };

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=900,height=1200");
    if (!w) return toast.error("Popup wurde blockiert.");
    const esc = (s = "") =>
      String(s ?? "").replace(
        /[&<>"']/g,
        (c) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          })[c],
      );
    const rows = marks
      .map((m, i) => {
        const tp = DAMAGE_TYPES.find((x) => x.id === m.type);
        const sv = SEVERITY.find((x) => x.id === m.severity);
        return `<tr><td>${i + 1}</td><td><span class="dot" style="background:${tp?.color}"></span>${esc(tp?.label)}</td><td>${esc(m.panel) || "—"}</td><td><b>${esc(m.action)}</b></td><td><span class="sev" style="color:${sv?.color}">${esc(sv?.label)}</span></td><td>${esc(m.note) || "—"}</td></tr>`;
      })
      .join("");
    w.document
      .write(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Lackier-Auftrag</title><style>
      *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#0f172a;padding:40px}
      .top{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0f172a;padding-bottom:14px}
      .brand{font-size:18px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}
      .doc{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.16em;text-align:right}
      h1{font-size:24px;margin:18px 0 2px}.sub{color:#64748b;font-size:13px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:12.5px}
      th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}
      th{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#64748b}
      .dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle}
      .sev{font-weight:700}.foot{margin-top:30px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}
      </style></head><body onload="window.print();window.onafterprint=()=>window.close()">
      <div class="top"><div class="brand">Autogalerie Jülich</div><div class="doc">Lackier- & Reparatur-Auftrag<br/>${new Date().toLocaleDateString("de-DE")}</div></div>
      <h1>${esc(carInfo.carName) || "Fahrzeug"}</h1><div class="sub">${carInfo.finNumber ? "FIN " + esc(carInfo.finNumber) + " · " : ""}${marks.length} Position(en)</div>
      <table><thead><tr><th>#</th><th>Schaden</th><th>Bauteil</th><th>Maßnahme</th><th>Grad</th><th>Notiz</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Keine Markierungen</td></tr>'}</tbody></table>
      <div class="foot">Erstellt mit dem 3D-Inspektionswerkzeug · Nur für den internen Gebrauch.</div></body></html>`);
    w.document.close();
    w.focus();
  };

  const selected = marks.find((m) => m.id === selectedMark);
  const counts = useMemo(
    () =>
      DAMAGE_TYPES.map((t) => ({
        ...t,
        n: marks.filter((m) => m.type === t.id).length,
      })),
    [marks],
  );

  return (
    <div style={fontStack} className="min-h-screen bg-[#f8fafc] text-slate-900">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-64"
        style={{
          background:
            "radial-gradient(80% 100% at 50% 0%, rgba(37,99,235,.06), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1440px] px-4 sm:px-6 py-5">
        {/* TOP BAR */}
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-slate-900 text-white shadow-sm">
              <FiTarget size={18} />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold leading-tight tracking-tight">
                Lackier-Inspektion{" "}
                <span className="font-normal text-slate-400">3D</span>
              </h1>
              <p className="text-[11px] text-slate-500">
                Schäden realistisch markieren · Maßnahmen festlegen · an die
                Werkstatt übergeben
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center overflow-hidden rounded-lg border border-slate-200 bg-white shadow-sm">
              <input
                value={carInfo.carName}
                onChange={(e) =>
                  setCarInfo((c) => ({ ...c, carName: e.target.value }))
                }
                placeholder="Fahrzeug"
                className="h-9 w-44 px-3 text-xs outline-none placeholder:text-slate-400"
              />
              <span className="h-5 w-px bg-slate-200" />
              <input
                value={carInfo.finNumber}
                onChange={(e) =>
                  setCarInfo((c) => ({ ...c, finNumber: e.target.value }))
                }
                placeholder="FIN"
                className="h-9 w-28 px-3 text-xs outline-none placeholder:text-slate-400"
              />
            </div>
            <button
              onClick={handleSave}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <FiSave size={14} /> Speichern
            </button>
            <button
              onClick={handlePrint}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50"
            >
              <FiPrinter size={14} /> Auftrag
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[1fr_360px]">
          {/* VIEWER */}
          <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,.06),0_12px_40px_-12px_rgba(15,23,42,.12)]">
            <div
              ref={mountRef}
              className="relative aspect-[16/10] w-full touch-none"
              style={{
                background: "linear-gradient(180deg,#ffffff 0%,#eef2f7 100%)",
                cursor: placing ? "crosshair" : "grab",
              }}
            >
              {!ready && !errored && (
                <div className="absolute inset-0 grid place-items-center">
                  <div className="flex flex-col items-center gap-3">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                    <span className="text-xs text-slate-400">{loadingMsg}</span>
                  </div>
                </div>
              )}
              {errored && (
                <div className="absolute inset-0 grid place-items-center px-6">
                  <div className="flex max-w-xs flex-col items-center gap-2 text-center">
                    <FiAlertCircle className="text-red-500" size={22} />
                    <p className="text-xs text-slate-500">
                      {loadingMsg}
                      <br />
                      Prüfe Modell-URL und CORS.
                    </p>
                  </div>
                </div>
              )}
              {ready && (
                <div className="pointer-events-none absolute left-4 top-4">
                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${placing ? "bg-blue-600 text-white" : "border border-slate-200 bg-white/90 text-slate-600"}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${placing ? "bg-white" : "bg-slate-400"}`}
                    />
                    {placing ? "Markier-Modus" : "Nur Ansicht"}
                  </span>
                </div>
              )}
              {ready && (
                <div className="absolute right-4 top-4 flex flex-col gap-1.5">
                  <ViewerBtn
                    onClick={() => setAutoSpin((s) => !s)}
                    active={autoSpin}
                    title="Auto-Drehung"
                  >
                    <FiRotateCw
                      size={15}
                      className={autoSpin ? "animate-spin" : ""}
                    />
                  </ViewerBtn>
                  <ViewerBtn
                    onClick={() => setPlacing((p) => !p)}
                    active={placing}
                    title="Markier-Modus"
                  >
                    <FiCrosshair size={15} />
                  </ViewerBtn>
                  <ViewerBtn onClick={resetView} title="Ansicht zurücksetzen">
                    <FiMaximize size={15} />
                  </ViewerBtn>
                </div>
              )}
              {ready && (
                <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                  <span className="rounded-full border border-slate-200/70 bg-white/85 px-3 py-1 text-[11px] text-slate-500 backdrop-blur-sm">
                    {placing
                      ? "Auf die beschädigte Stelle klicken — Größe & Richtung danach rechts anpassen"
                      : "Ziehen zum Drehen · Scrollen zum Zoomen"}
                  </span>
                </div>
              )}
              {ready && marks.length > 0 && (
                <div className="absolute bottom-3 left-4 flex flex-wrap gap-2">
                  {counts
                    .filter((c) => c.n > 0)
                    .map((c) => (
                      <span
                        key={c.id}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-slate-600 backdrop-blur-sm"
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ background: c.color }}
                        />
                        {c.label} · {c.n}
                      </span>
                    ))}
                </div>
              )}
            </div>
          </section>

          {/* SIDEBAR */}
          <aside className="flex flex-col gap-4">
            <Panel title="1 · Schadensart wählen">
              <div className="grid grid-cols-2 gap-1.5">
                {DAMAGE_TYPES.map((t) => {
                  const on = activeType === t.id;
                  const n = counts.find((c) => c.id === t.id)?.n || 0;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setActiveType(t.id)}
                      className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-medium transition ${on ? "border-slate-900 bg-slate-900 text-white shadow-sm" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className="h-2.5 w-2.5 rounded-full ring-2 ring-white/40"
                          style={{ background: t.color }}
                        />
                        {t.label}
                      </span>
                      {n > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${on ? "bg-white/20" : "bg-slate-100 text-slate-500"}`}
                        >
                          {n}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <p className="mt-2.5 text-[10.5px] leading-relaxed text-slate-400">
                Art wählen, dann auf die Stelle klicken. Die Markierung sieht
                aus wie der echte Schaden und haftet am Bauteil.
              </p>
            </Panel>

            {selected ? (
              <Panel
                title="2 · Maßnahme & Größe"
                action={
                  <button
                    onClick={() => setSelectedMark(null)}
                    className="text-slate-400 hover:text-slate-600"
                  >
                    <FiX size={15} />
                  </button>
                }
              >
                <div className="space-y-3">
                  <Field label="Schadensart">
                    <div className="flex flex-wrap gap-2">
                      {DAMAGE_TYPES.map((t) => (
                        <button
                          key={t.id}
                          onClick={() =>
                            updateMark(selected.id, { type: t.id })
                          }
                          title={t.label}
                          className="h-7 w-7 rounded-full border-2 transition"
                          style={{
                            background: t.color,
                            borderColor:
                              selected.type === t.id
                                ? "#0f172a"
                                : "transparent",
                          }}
                        />
                      ))}
                    </div>
                  </Field>

                  {/* SIZE — solves "marker too big" */}
                  <Field
                    label={`Größe · ${(selected.size * 100).toFixed(0)} cm`}
                  >
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          updateMark(selected.id, {
                            size: Math.max(
                              0.05,
                              +(selected.size - 0.02).toFixed(2),
                            ),
                          })
                        }
                        className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                      >
                        <FiMinus size={13} />
                      </button>
                      <input
                        type="range"
                        min={0.05}
                        max={0.6}
                        step={0.01}
                        value={selected.size}
                        onChange={(e) =>
                          updateMark(selected.id, {
                            size: parseFloat(e.target.value),
                          })
                        }
                        className="flex-1 accent-blue-600"
                      />
                      <button
                        onClick={() =>
                          updateMark(selected.id, {
                            size: Math.min(
                              0.6,
                              +(selected.size + 0.02).toFixed(2),
                            ),
                          })
                        }
                        className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                      >
                        <FiPlus size={13} />
                      </button>
                    </div>
                  </Field>

                  {/* ROTATION — match a scratch's real direction */}
                  <Field
                    label={`Ausrichtung · ${Math.round((selected.rotation * 180) / Math.PI)}°`}
                  >
                    <input
                      type="range"
                      min={0}
                      max={Math.PI}
                      step={0.02}
                      value={selected.rotation}
                      onChange={(e) =>
                        updateMark(selected.id, {
                          rotation: parseFloat(e.target.value),
                        })
                      }
                      className="w-full accent-blue-600"
                    />
                  </Field>

                  <Field label="Maßnahme">
                    <Select
                      value={selected.action}
                      onChange={(v) => updateMark(selected.id, { action: v })}
                      options={ACTIONS}
                    />
                  </Field>
                  <Field label="Bauteil">
                    <Select
                      value={selected.panel}
                      onChange={(v) => updateMark(selected.id, { panel: v })}
                      options={["", ...PANELS]}
                      placeholder="(optional)"
                    />
                  </Field>

                  <Field label="Schweregrad">
                    <div className="grid grid-cols-3 gap-1.5">
                      {SEVERITY.map((s) => {
                        const on = selected.severity === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() =>
                              updateMark(selected.id, { severity: s.id })
                            }
                            className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${on ? "text-white shadow-sm" : "border-slate-200 bg-white text-slate-600 hover:bg-slate-50"}`}
                            style={
                              on
                                ? { background: s.color, borderColor: s.color }
                                : {}
                            }
                          >
                            {s.label}
                          </button>
                        );
                      })}
                    </div>
                  </Field>

                  <Field label="Notiz">
                    <textarea
                      value={selected.note}
                      onChange={(e) =>
                        updateMark(selected.id, { note: e.target.value })
                      }
                      placeholder="z. B. tiefer Kratzer, ca. 15 cm …"
                      rows={2}
                      className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                    />
                  </Field>

                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => flyToMark(selected)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-blue-600 hover:text-blue-700"
                    >
                      <FiTarget size={13} /> Zur Stelle springen
                    </button>
                    <button
                      onClick={() => deleteMark(selected.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600 hover:text-red-700"
                    >
                      <FiTrash2 size={13} /> Entfernen
                    </button>
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel title="2 · Maßnahme & Größe">
                <div className="flex flex-col items-center gap-2 py-5 text-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-slate-100 text-slate-400">
                    <FiCrosshair size={18} />
                  </div>
                  <p className="max-w-[210px] text-[11px] leading-relaxed text-slate-400">
                    Wähle eine Markierung, um Größe, Ausrichtung, Maßnahme und
                    Schweregrad festzulegen.
                  </p>
                </div>
              </Panel>
            )}

            <Panel
              title={`Positionen · ${marks.length}`}
              action={
                marks.length > 0 && (
                  <button
                    onClick={clearAll}
                    className="text-[11px] font-medium text-red-600 hover:text-red-700"
                  >
                    Alle löschen
                  </button>
                )
              }
              className="flex-1"
            >
              {marks.length === 0 ? (
                <p className="py-3 text-center text-[11px] text-slate-400">
                  Noch keine Markierungen.
                </p>
              ) : (
                <ul className="-mx-1 max-h-72 space-y-0.5 overflow-auto px-1">
                  {marks.map((m, i) => {
                    const t = DAMAGE_TYPES.find((x) => x.id === m.type);
                    const sv = SEVERITY.find((x) => x.id === m.severity);
                    const on = selectedMark === m.id;
                    return (
                      <li
                        key={m.id}
                        onClick={() => selectMark(m.id)}
                        className={`group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${on ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-slate-50"}`}
                      >
                        <span
                          className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                          style={{ background: t?.color }}
                        >
                          {i + 1}
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-1.5">
                            <span className="font-semibold text-slate-700">
                              {m.action}
                            </span>
                            <span className="h-1 w-1 rounded-full bg-slate-300" />
                            <span className="truncate text-slate-500">
                              {m.panel || t?.label}
                            </span>
                          </span>
                          {m.note && (
                            <span className="block truncate text-[10.5px] text-slate-400">
                              {m.note}
                            </span>
                          )}
                        </span>
                        <span
                          className="flex-shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide"
                          style={{
                            color: sv?.color,
                            background: `${sv?.color}1a`,
                          }}
                        >
                          {sv?.label}
                        </span>
                        <FiTarget
                          className="flex-shrink-0 text-slate-300 opacity-0 transition group-hover:opacity-100"
                          size={13}
                        />
                      </li>
                    );
                  })}
                </ul>
              )}
            </Panel>
          </aside>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   DAMAGE TEXTURES — each type drawn on a canvas so it
   reads as the real thing on the car surface.
========================================================= */
function buildDamageTextures(THREE) {
  const S = 256;
  const tex = (draw) => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, S, S);
    draw(ctx);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  };

  // KRATZER — thin streaks across the surface
  const scratch = tex((ctx) => {
    ctx.strokeStyle = "rgba(14,165,233,0.95)";
    ctx.lineCap = "round";
    for (let i = 0; i < 5; i++) {
      ctx.beginPath();
      ctx.lineWidth = 2 + Math.random() * 2;
      const y = S * 0.5 + (i - 2) * 8 + (Math.random() * 6 - 3);
      ctx.moveTo(S * 0.12, y + (Math.random() * 10 - 5));
      ctx.bezierCurveTo(
        S * 0.4,
        y - 6,
        S * 0.6,
        y + 6,
        S * 0.88,
        y + (Math.random() * 10 - 5),
      );
      ctx.globalAlpha = 0.6 + Math.random() * 0.4;
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
    // faint white highlight under the main scratch (bare metal look)
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(S * 0.12, S * 0.5);
    ctx.bezierCurveTo(
      S * 0.4,
      S * 0.5 - 6,
      S * 0.6,
      S * 0.5 + 6,
      S * 0.88,
      S * 0.5,
    );
    ctx.stroke();
  });

  // DELLE — soft radial shading like a pushed-in dent + highlight rim
  const dent = tex((ctx) => {
    const g = ctx.createRadialGradient(S / 2, S / 2, 6, S / 2, S / 2, S / 2.2);
    g.addColorStop(0, "rgba(120,72,8,0.55)");
    g.addColorStop(0.5, "rgba(245,158,11,0.30)");
    g.addColorStop(1, "rgba(245,158,11,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2.1, 0, Math.PI * 2);
    ctx.fill();
    // crescent highlight (light catching the dent edge)
    ctx.strokeStyle = "rgba(255,255,255,0.7)";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 3.4, Math.PI * 0.15, Math.PI * 0.95);
    ctx.stroke();
    ctx.strokeStyle = "rgba(245,158,11,0.9)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2.4, 0, Math.PI * 2);
    ctx.stroke();
  });

  // LACKSCHADEN — irregular chipped blotch, paint flaking
  const paint = tex((ctx) => {
    ctx.fillStyle = "rgba(239,68,68,0.5)";
    ctx.beginPath();
    const cx = S / 2,
      cy = S / 2,
      pts = 12;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = (S / 3.4) * (0.7 + Math.random() * 0.5);
      const x = cx + Math.cos(a) * r,
        y = cy + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // flaked chips
    ctx.fillStyle = "rgba(239,68,68,0.85)";
    for (let i = 0; i < 9; i++) {
      const a = Math.random() * Math.PI * 2,
        r = (S / 4) * Math.random();
      ctx.beginPath();
      ctx.arc(
        cx + Math.cos(a) * r,
        cy + Math.sin(a) * r,
        3 + Math.random() * 5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.strokeStyle = "rgba(150,20,20,0.9)";
    ctx.lineWidth = 2;
    ctx.stroke();
  });

  // ROST — mottled brown grainy patch
  const rust = tex((ctx) => {
    const g = ctx.createRadialGradient(S / 2, S / 2, 4, S / 2, S / 2, S / 2.1);
    g.addColorStop(0, "rgba(120,60,10,0.85)");
    g.addColorStop(1, "rgba(161,98,7,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2.1, 0, Math.PI * 2);
    ctx.fill();
    for (let i = 0; i < 500; i++) {
      const a = Math.random() * Math.PI * 2,
        r = (Math.random() * S) / 2.3;
      const x = S / 2 + Math.cos(a) * r,
        y = S / 2 + Math.sin(a) * r;
      ctx.fillStyle = `rgba(${90 + Math.random() * 70},${40 + Math.random() * 40},10,${Math.random() * 0.6})`;
      ctx.fillRect(x, y, 2, 2);
    }
  });

  // RISS / BRUCH — jagged crack lines
  const crack = tex((ctx) => {
    ctx.strokeStyle = "rgba(124,58,237,0.95)";
    ctx.lineWidth = 3;
    ctx.lineCap = "round";
    const branch = (x, y, ang, len, depth) => {
      if (depth <= 0) return;
      const nx = x + Math.cos(ang) * len,
        ny = y + Math.sin(ang) * len;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.lineWidth = depth;
      ctx.stroke();
      branch(nx, ny, ang + (Math.random() - 0.5), len * 0.7, depth - 1);
      if (Math.random() > 0.4)
        branch(nx, ny, ang + (Math.random() - 0.5) * 1.5, len * 0.6, depth - 1);
    };
    branch(S / 2, S / 2, Math.random() * Math.PI * 2, S / 5, 4);
    branch(S / 2, S / 2, Math.random() * Math.PI * 2, S / 5, 4);
  });

  // SONSTIGES — clean target ring
  const other = tex((ctx) => {
    ctx.strokeStyle = "rgba(71,85,105,0.95)";
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 3, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = "rgba(71,85,105,0.9)";
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, 8, 0, Math.PI * 2);
    ctx.fill();
  });

  return { scratch, dent, paint, rust, crack, other };
}

/* number bead canvas */
function numberBead(n, color) {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#fff";
  ctx.stroke();
  ctx.fillStyle = "#fff";
  ctx.font = "bold 34px system-ui, sans-serif";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n), S / 2, S / 2 + 1);
  return c;
}

/* ---------- UI primitives ---------- */
function Panel({ title, action, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,.05)] ${className}`}
    >
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          {title}
        </h2>
        {action}
      </div>
      {children}
    </div>
  );
}
function Field({ label, children }) {
  return (
    <div>
      <label className="mb-1 block text-[10.5px] font-medium uppercase tracking-wide text-slate-400">
        {label}
      </label>
      {children}
    </div>
  );
}
function Select({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        {options.map((o) => (
          <option key={o || "_"} value={o}>
            {o === "" ? placeholder || "—" : o}
          </option>
        ))}
      </select>
      <FiChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400"
        size={14}
      />
    </div>
  );
}
function ViewerBtn({ children, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`grid h-9 w-9 place-items-center rounded-lg border shadow-sm backdrop-blur-sm transition ${active ? "border-blue-600 bg-blue-600 text-white" : "border-slate-200 bg-white/90 text-slate-600 hover:bg-white"}`}
    >
      {children}
    </button>
  );
}
const fontStack = {
  fontFamily:
    "'Söhne','Geist','Manrope',ui-sans-serif,system-ui,-apple-system,sans-serif",
};

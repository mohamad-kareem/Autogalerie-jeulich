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
  FiChevronRight,
  FiAlertCircle,
  FiPlus,
  FiFolder,
  FiFolderPlus,
  FiTruck,
  FiSearch,
  FiPlusCircle,
  FiClipboard,
} from "react-icons/fi";

/* =========================================================
   BRANDS — each brand has a fixed .glb model
========================================================= */
const BRANDS = [
  {
    id: "mercedes",
    label: "Mercedes-Benz",
    model: "/uploads_files_5489305_Glk.glb",
  },
  { id: "mercedes1", label: "Mercedes-Benz1", model: "/mercedes.glb" },
  { id: "Peugeot", label: "Peugeot", model: "/peugeot.glb" },
  { id: "Ford", label: "Ford", model: "/fordfocus.glb" },
  { id: "Hyundai", label: "Hyundai", model: "/hyundai.glb" },
  { id: "Opel", label: "Opel", model: "/opel.glb" },
  { id: "Kia", label: "Kia", model: "/kiapicanto.glb" },
  { id: "Kia1", label: "Kia1", model: "/kiapicanto1.glb" },
];

const DAMAGE_TYPES = [
  { id: "scratch", label: "Kratzer", color: "#0891b2" },
  { id: "dent", label: "Delle", color: "#f59e0b" },
  { id: "paint", label: "Lackschaden", color: "#e11d48" },
  { id: "rust", label: "Rost", color: "#b45309" },
  { id: "crack", label: "Riss / Bruch", color: "#7c3aed" },
  { id: "other", label: "Sonstiges", color: "#52525b" },
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
  { id: "low", label: "Leicht", color: "#16a34a" },
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

const ELONGATED = new Set(["scratch", "crack"]);
const GLOBAL_ACTIONS = [
  { id: "full_paint", label: "Komplett-Lackierung", icon: "🎨" },
  { id: "full_polish", label: "Komplett-Politur", icon: "✨" },
  { id: "hagel", label: "Hagelschaden", icon: "🌨" },
  { id: "interior_clean", label: "Innenreinigung", icon: "🧽" },
  { id: "underbody", label: "Unterbodenschutz", icon: "🛡" },
  { id: "wheel_refinish", label: "Felgen aufbereiten", icon: "⚙" },
];

const makeMark = (local, normal, type) => ({
  id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  local,
  normal,
  type,
  action: "Lackieren",
  severity: "mid",
  panel: "",
  note: "",
  size: 0.06,
  length: ELONGATED.has(type) ? 0.14 : 0.06,
  rotation: 0,
});

export default function VehicleInspection3DPage() {
  // Vehicles
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || null;
  const activeBrand = activeVehicle
    ? BRANDS.find((b) => b.id === activeVehicle.brandId)
    : null;

  // Marks & globals per vehicle
  const [marksByVehicle, setMarksByVehicle] = useState({});
  const [globalsByVehicle, setGlobalsByVehicle] = useState({});
  const marks = (activeVehicleId && marksByVehicle[activeVehicleId]) || [];
  const activeGlobals = (activeVehicleId &&
    globalsByVehicle[activeVehicleId]) || { actions: {}, custom: [] };

  // UI state
  const [activeType, setActiveType] = useState(null); // null = no tool armed
  const [selectedMarkId, setSelectedMarkId] = useState(null);
  const [autoSpin, setAutoSpin] = useState(true);
  const [showAddVehicle, setShowAddVehicle] = useState(false);
  const [customGlobalInput, setCustomGlobalInput] = useState("");

  // IMPORTANT:
  // three.current is a ref, so changing three.current.carMeshes does NOT re-run React effects.
  // These two states force React to re-run model loading and pointer-selection logic at the right time.
  const [sceneReady, setSceneReady] = useState(false);
  const [modelReady, setModelReady] = useState(false);

  // Three.js refs
  const mountRef = useRef(null);
  const three = useRef({});
  const marksRef = useRef(marks);
  marksRef.current = marks;
  const activeTypeRef = useRef(activeType);
  activeTypeRef.current = activeType;
  const selectedMarkIdRef = useRef(selectedMarkId);
  selectedMarkIdRef.current = selectedMarkId;

  const autoSpinRef = useRef(autoSpin);
  autoSpinRef.current = autoSpin;

  // Helper to update marks
  const setMarks = useCallback(
    (updater) => {
      if (!activeVehicleId) return;
      setMarksByVehicle((prev) => {
        const cur = prev[activeVehicleId] || [];
        const next = typeof updater === "function" ? updater(cur) : updater;
        return { ...prev, [activeVehicleId]: next };
      });
    },
    [activeVehicleId],
  );

  const updateMark = useCallback(
    (id, patch) => {
      setMarks((prev) =>
        prev.map((m) => (m.id === id ? { ...m, ...patch } : m)),
      );
    },
    [setMarks],
  );

  const deleteMark = useCallback(
    (id) => {
      setMarks((prev) => prev.filter((m) => m.id !== id));
      if (selectedMarkId === id) setSelectedMarkId(null);
    },
    [setMarks, selectedMarkId],
  );

  // Global actions
  const toggleGlobal = (id) => {
    setGlobalsByVehicle((prev) => {
      const cur = prev[activeVehicleId] || { actions: {}, custom: [] };
      const newActions = { ...cur.actions, [id]: !cur.actions?.[id] };
      return { ...prev, [activeVehicleId]: { ...cur, actions: newActions } };
    });
  };
  const addCustomGlobal = () => {
    const val = customGlobalInput.trim();
    if (!val) return;
    setGlobalsByVehicle((prev) => {
      const cur = prev[activeVehicleId] || { actions: {}, custom: [] };
      return {
        ...prev,
        [activeVehicleId]: { ...cur, custom: [...cur.custom, val] },
      };
    });
    setCustomGlobalInput("");
  };
  const removeCustomGlobal = (idx) => {
    setGlobalsByVehicle((prev) => {
      const cur = prev[activeVehicleId] || { actions: {}, custom: [] };
      return {
        ...prev,
        [activeVehicleId]: {
          ...cur,
          custom: cur.custom.filter((_, i) => i !== idx),
        },
      };
    });
  };
  const clearAllTasks = () => {
    if (!confirm("Alle Aufgaben dieses Fahrzeugs entfernen?")) return;
    setMarks([]);
    setSelectedMarkId(null);
    setGlobalsByVehicle((prev) => ({
      ...prev,
      [activeVehicleId]: { actions: {}, custom: [] },
    }));
  };

  // Vehicle management
  const addVehicle = ({ brandId, name, fin }) => {
    const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    setVehicles((prev) => [
      ...prev,
      { id, brandId, name: name.trim(), fin: fin.trim() },
    ]);
    setActiveVehicleId(id);
    setShowAddVehicle(false);
    toast.success("Fahrzeug hinzugefügt");
  };
  const deleteVehicle = (id) => {
    if (!confirm("Fahrzeug wirklich entfernen?")) return;
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setMarksByVehicle((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    setGlobalsByVehicle((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    if (activeVehicleId === id) setActiveVehicleId(null);
  };

  // Print & Save
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
    const globalRows = [
      ...Object.entries(activeGlobals.actions || {})
        .filter(([, on]) => on)
        .map(([id]) => GLOBAL_ACTIONS.find((x) => x.id === id)?.label)
        .filter(Boolean),
      ...(activeGlobals.custom || []),
    ];
    const globalsHtml =
      globalRows.length === 0
        ? ""
        : `<h2 style="font-size:13px;margin:24px 0 6px;letter-spacing:.08em;text-transform:uppercase;color:#475569">Gesamtfahrzeug</h2><ul style="margin:0;padding-left:18px;font-size:13px">${globalRows.map((r) => `<li><b>${esc(r)}</b></li>`).join("")}</ul>`;
    const rows = marks
      .map((m, i) => {
        const tp = DAMAGE_TYPES.find((x) => x.id === m.type);
        const sv = SEVERITY.find((x) => x.id === m.severity);
        return `<tr><td>${i + 1}</td><td><span class="dot" style="background:${tp?.color}"></span>${esc(tp?.label)}</td><td>${esc(m.panel) || "—"}</td><td><b>${esc(m.action)}</b></td><td class="sev" style="color:${sv?.color}">${esc(sv?.label)}</td></td><td>${esc(m.note) || "—"}</td></tr>`;
      })
      .join("");
    const title = activeVehicle
      ? `${activeBrand?.label || ""} ${activeVehicle.name}`
      : "Fahrzeug";
    w.document.write(
      `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Lackier-Auftrag</title><style>*{box-sizing:border-box}body{font-family:'Segoe UI',sans-serif;color:#0f172a;padding:40px}.top{display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:14px}.brand{font-size:18px;font-weight:800;letter-spacing:.14em}.doc{font-size:11px;color:#64748b;text-align:right}h1{font-size:24px;margin:18px 0 2px}.sub{color:#64748b;font-size:13px;margin-bottom:20px}table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #e2e8f0}th{font-size:10px;text-transform:uppercase;color:#64748b}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle}.sev{font-weight:700}.foot{margin-top:30px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}</style></head><body onload="window.print();window.onafterprint=()=>window.close()"><div class="top"><div class="brand">Autogalerie Jülich</div><div class="doc">Lackier- & Reparatur-Auftrag<br/>${new Date().toLocaleDateString("de-DE")}</div></div><h1>${esc(title)}</h1><div class="sub">${activeVehicle?.fin ? "FIN " + esc(activeVehicle.fin) + " · " : ""}${marks.length} Position(en) · ${globalRows.length} Gesamt-Maßnahme(n)</div>${globalsHtml}<h2 style="font-size:13px;margin:24px 0 6px;letter-spacing:.08em;text-transform:uppercase;color:#475569">Einzelpositionen</h2><table><thead><tr><th>#</th><th>Schaden</th><th>Bauteil</th><th>Maßnahme</th><th>Grad</th><th>Notiz</th></tr></thead><tbody>${rows || '<tr><td colspan="6">Keine Markierungen</td></tr>'}</tbody></table><div class="foot">Erstellt mit dem 3D-Inspektionswerkzeug</div></body></html>`,
    );
    w.document.close();
    w.focus();
  };
  const handleSave = async () => {
    const payload = {
      vehicle: activeVehicle,
      brand: activeBrand?.label,
      marks,
      globals: activeGlobals,
    };
    console.log("Inspection payload", payload);
    toast.success("Auftrag gespeichert (Konsole)");
  };

  // Camera fly-to-mark (uses t.THREE)
  const flyToMark = useCallback((mark) => {
    const t = three.current;
    if (!t.camera || !mark || !t.THREE) return;
    const world = t.carGroup.localToWorld(new t.THREE.Vector3(...mark.local));
    const center = new t.THREE.Vector3(0, world.y, 0);
    const dir = world.clone().sub(center);
    dir.y = 0;
    if (dir.lengthSq() < 1e-4) dir.set(1, 0, 1);
    dir.normalize();
    const R = (t.localCarRadius || 2) * (t.carGroup.scale.x || 1);
    const dist = R * (0.85 + (mark.size || 0.06) * 1.5);
    const camPos = world
      .clone()
      .add(dir.multiplyScalar(dist))
      .add(new t.THREE.Vector3(0, R * 0.25, 0));
    t.fly.fromCam.copy(t.camera.position);
    t.fly.toCam.copy(camPos);
    t.fly.fromTgt.copy(t.controls.target);
    t.fly.toTgt.copy(world);
    t.fly.t = 0;
    t.fly.active = true;
    setAutoSpin(false);
  }, []);

  const selectMark = (id) => {
    setSelectedMarkId(id);
    const m = marks.find((m) => m.id === id);
    if (m) flyToMark(m);
  };

  const resetView = () => {
    const t = three.current;
    if (!t.camera) return;
    t.fly.fromCam.copy(t.camera.position);
    t.fly.fromTgt.copy(t.controls.target);
    if (t.homeView) {
      t.fly.toCam.copy(t.homeView.camPos);
      t.fly.toTgt.copy(t.homeView.center);
    } else {
      t.fly.toCam.set(5.4, 2.5, 6.4);
      t.fly.toTgt.set(0, 0.65, 0);
    }
    t.fly.t = 0;
    t.fly.active = true;
    setAutoSpin(false);
  };

  // ========== THREE.JS SETUP ==========
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
        const { DRACOLoader } = await import(
          /* webpackIgnore: true */ "https://esm.sh/three@0.160.0/examples/jsm/loaders/DRACOLoader.js"
        );
        const { RoomEnvironment } = await import(
          /* webpackIgnore: true */ "https://esm.sh/three@0.160.0/examples/jsm/environments/RoomEnvironment.js"
        );
        if (disposed) return;

        const mount = mountRef.current;
        const width = mount.clientWidth,
          height = mount.clientHeight;
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
        renderer.domElement.style.position = "absolute";
        renderer.domElement.style.inset = "0";
        renderer.domElement.style.zIndex = "0";
        renderer.domElement.style.width = "100%";
        renderer.domElement.style.height = "100%";
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        mount.appendChild(renderer.domElement);

        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(
          new RoomEnvironment(),
          0.04,
        ).texture;

        scene.add(new THREE.HemisphereLight(0xffffff, 0xededee, 0.55));
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
            color: 0xf2f2f4,
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
            color: 0x4f46e5,
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
        const decalGroup = new THREE.Group();
        carGroup.add(decalGroup);
        const handleGroup = new THREE.Group();
        carGroup.add(handleGroup);

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
        const textures = buildDamageTextures(THREE);
        const dracoLoader = new DRACOLoader();
        dracoLoader.setDecoderPath(
          "https://www.gstatic.com/draco/versioned/decoders/1.5.6/",
        );
        const gltfLoader = new GLTFLoader();
        gltfLoader.setDRACOLoader(dracoLoader);

        three.current = {
          THREE,
          scene,
          camera,
          renderer,
          controls,
          pmrem,
          carGroup,
          decalGroup,
          handleGroup,
          raycaster,
          pointer,
          carMeshes: [],
          fly,
          textures,
          loader: gltfLoader,
          dracoLoader,
          modelRoot: null,
          loadedModel: null,
        };

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
        let raf;
        const tick = () => {
          raf = requestAnimationFrame(tick);
          if (fly.active) {
            fly.t += 1 / 60 / fly.dur;
            const k = easeInOut(Math.min(fly.t, 1));
            camera.position.lerpVectors(fly.fromCam, fly.toCam, k);
            controls.target.lerpVectors(fly.fromTgt, fly.toTgt, k);
            if (fly.t >= 1) fly.active = false;
          } else if (autoSpinRef.current) carGroup.rotation.y += 0.0036;
          controls.update();
          renderer.render(scene, camera);
        };
        tick();

        cleanup = () => {
          cancelAnimationFrame(raf);
          window.removeEventListener("resize", onResize);
          controls.dispose();
          pmrem.dispose();
          dracoLoader.dispose?.();
          renderer.dispose();
          renderer.domElement.parentNode?.removeChild(renderer.domElement);
        };
        three.current.initialized = true;
        setSceneReady(true);
      } catch (err) {
        console.error(err);
        toast.error("WebGL wird nicht unterstützt.");
      }
    })();
    return () => {
      disposed = true;
      cleanup();
    };
  }, []);

  // Load model when brand changes (uses t.THREE)
  useEffect(() => {
    const t = three.current;
    if (!sceneReady || !t.initialized || !t.THREE) return;

    setModelReady(false);

    if (!activeBrand?.model || !activeVehicle) {
      if (t.modelRoot) t.carGroup.remove(t.modelRoot);
      t.modelRoot = null;
      t.loadedModel = null;
      t.carMeshes = [];
      setSelectedMarkId(null);
      return;
    }

    if (
      t.loadedModel === activeBrand.model &&
      t.modelRoot &&
      t.carMeshes?.length
    ) {
      setModelReady(true);
      return;
    }

    setSelectedMarkId(null);
    if (t.modelRoot) t.carGroup.remove(t.modelRoot);
    while (t.decalGroup.children.length)
      t.decalGroup.remove(t.decalGroup.children[0]);
    while (t.handleGroup.children.length)
      t.handleGroup.remove(t.handleGroup.children[0]);
    t.carMeshes = [];

    t.loader.load(
      activeBrand.model,
      (gltf) => {
        t.modelRoot = gltf.scene;
        t.loadedModel = activeBrand.model;
        t.carGroup.add(gltf.scene);

        gltf.scene.updateMatrixWorld(true);
        t.carGroup.updateMatrixWorld(true);

        const meshes = [];
        gltf.scene.traverse((o) => {
          if (o.isMesh && o.geometry) {
            o.visible = true;
            meshes.push(o);
          }
        });
        const box = new t.THREE.Box3();
        meshes.forEach((m) => box.expandByObject(m));
        const size = new t.THREE.Vector3();
        box.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z);
        const scale = 3.6 / maxDim;
        t.carGroup.scale.setScalar(scale);
        const newBox = new t.THREE.Box3().setFromObject(t.carGroup);
        const center = new t.THREE.Vector3();
        newBox.getCenter(center);
        t.carGroup.position.x -= center.x;
        t.carGroup.position.z -= center.z;
        t.carGroup.position.y -= newBox.min.y;
        t.carMeshes = meshes;
        meshes.forEach((m) => {
          m.castShadow = true;
          m.receiveShadow = true;
        });
        const finalBox = new t.THREE.Box3().setFromObject(t.carGroup);
        const rad = finalBox.getBoundingSphere(new t.THREE.Sphere()).radius;
        t.localCarRadius = rad / scale;
        const carCenter = new t.THREE.Vector3();
        finalBox.getCenter(carCenter);
        t.controls.target.copy(carCenter);
        t.controls.update();
        t.homeView = {
          center: carCenter.clone(),
          camPos: t.camera.position.clone(),
        };

        // This is the key fix: the click/marking useEffect waits for this.
        setModelReady(true);
      },
      undefined,
      (err) => {
        console.error(err);
        setModelReady(false);
        toast.error("Modell konnte nicht geladen werden.");
      },
    );
  }, [sceneReady, activeBrand?.model, activeVehicleId]);

  // Sync marks to decals
  useEffect(() => {
    const t = three.current;
    if (!modelReady || !t.decalGroup || !t.THREE || !t.modelRoot) return;
    while (t.decalGroup.children.length)
      t.decalGroup.remove(t.decalGroup.children[0]);
    while (t.handleGroup.children.length)
      t.handleGroup.remove(t.handleGroup.children[0]);
    marks.forEach((m, idx) =>
      addMarkVisual(
        t,
        t.decalGroup,
        m,
        idx + 1,
        m.id === selectedMarkId,
        false,
      ),
    );
    const sel = marks.find((m) => m.id === selectedMarkId);
    if (sel) addHandles(t, t.handleGroup, sel);
  }, [marks, selectedMarkId, modelReady]);

  // ========== CLEAN INTERACTION LOGIC (uses t.THREE) ==========
  useEffect(() => {
    const t = three.current;
    if (!modelReady || !t.renderer || !t.carMeshes?.length || !t.THREE) return;

    const el = t.renderer.domElement;

    const getHitMark = () => {
      const hits = t.raycaster.intersectObjects(t.decalGroup.children, true);
      const hit = hits.find((h) => h.object.userData?.markId);
      return hit ? hit.object.userData.markId : null;
    };

    const getHitCarPoint = () => {
      const hits = t.raycaster.intersectObjects(t.carMeshes, true);
      if (!hits.length) return null;
      const hit = hits[0];
      const localPt = t.carGroup.worldToLocal(hit.point.clone());
      let normal = new t.THREE.Vector3(0, 0, 1);
      if (hit.face) {
        const worldNormal = hit.face.normal
          .clone()
          .transformDirection(hit.object.matrixWorld);
        const invNormal = new t.THREE.Matrix3()
          .getNormalMatrix(t.carGroup.matrixWorld)
          .invert();
        normal = worldNormal.applyMatrix3(invNormal).normalize();
      }
      return { localPt, normal };
    };

    let dragHandle = null;
    let downPoint = null;

    const onPointerDown = (e) => {
      if (e.button !== 0) return;
      const rect = el.getBoundingClientRect();
      t.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      t.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      t.raycaster.setFromCamera(t.pointer, t.camera);

      const handleHits = t.raycaster.intersectObjects(
        t.handleGroup.children,
        true,
      );
      if (handleHits.length) {
        const hit = handleHits[0];
        const handleData = hit.object.userData;
        if (handleData.handle) {
          const mark = marksRef.current.find((m) => m.id === handleData.markId);
          if (mark) {
            const nrm = new t.THREE.Vector3(...mark.normal).normalize();
            const q = new t.THREE.Quaternion().setFromUnitVectors(
              new t.THREE.Vector3(0, 0, 1),
              nrm,
            );
            const basis = {
              center: new t.THREE.Vector3(...mark.local),
              ex: new t.THREE.Vector3(1, 0, 0).applyQuaternion(q),
              ey: new t.THREE.Vector3(0, 1, 0).applyQuaternion(q),
            };
            let anchor = null;
            if (
              ELONGATED.has(mark.type) &&
              (handleData.handle === "endA" || handleData.handle === "endB")
            ) {
              const rot = mark.rotation || 0;
              const half = (mark.length || 0.14) * (t.localCarRadius || 2);
              const axis = basis.ex
                .clone()
                .multiplyScalar(Math.cos(rot))
                .add(basis.ey.clone().multiplyScalar(Math.sin(rot)));
              const sign = handleData.handle === "endB" ? -1 : 1;
              anchor = basis.center
                .clone()
                .add(axis.multiplyScalar(sign * half));
            }
            dragHandle = {
              markId: handleData.markId,
              handleType: handleData.handle,
              basis,
              anchor,
            };
            t.controls.enabled = false;
            el.setPointerCapture(e.pointerId);
            e.preventDefault();
          }
        }
        return;
      }
      downPoint = {
        x: e.clientX,
        y: e.clientY,
        moved: false,
        time: performance.now(),
      };
    };

    const onPointerMove = (e) => {
      if (dragHandle) {
        const rect = el.getBoundingClientRect();
        t.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        t.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
        t.raycaster.setFromCamera(t.pointer, t.camera);
        const mark = marksRef.current.find((m) => m.id === dragHandle.markId);
        if (!mark) return;
        const nrm = new t.THREE.Vector3(...mark.normal).normalize();
        const worldNrm = nrm
          .clone()
          .transformDirection(t.carGroup.matrixWorld)
          .normalize();
        const worldCenter = t.carGroup.localToWorld(
          new t.THREE.Vector3(...mark.local),
        );
        const plane = new t.THREE.Plane().setFromNormalAndCoplanarPoint(
          worldNrm,
          worldCenter,
        );
        const intersectPoint = new t.THREE.Vector3();
        if (t.raycaster.ray.intersectPlane(plane, intersectPoint)) {
          const localPt = t.carGroup.worldToLocal(intersectPoint);
          const R = t.localCarRadius;
          const rel = localPt.clone().sub(dragHandle.basis.center);
          const u = rel.dot(dragHandle.basis.ex);
          const v = rel.dot(dragHandle.basis.ey);
          if (!ELONGATED.has(mark.type)) {
            if (dragHandle.handleType === "radius") {
              const newSize = Math.min(
                0.28,
                Math.max(0.018, Math.hypot(u, v) / R),
              );
              updateMark(mark.id, { size: newSize });
            }
          } else {
            const rot = mark.rotation || 0;
            const axis = dragHandle.basis.ex
              .clone()
              .multiplyScalar(Math.cos(rot))
              .add(dragHandle.basis.ey.clone().multiplyScalar(Math.sin(rot)));
            const halfLen = (mark.length || 0.14) * R;
            if (
              dragHandle.handleType === "endA" ||
              dragHandle.handleType === "endB"
            ) {
              const sign = dragHandle.handleType === "endB" ? 1 : -1;
              const fixedEnd =
                dragHandle.anchor ||
                dragHandle.basis.center
                  .clone()
                  .add(axis.clone().multiplyScalar(-sign * halfLen));
              const moving = localPt;
              const seg = moving.clone().sub(fixedEnd);
              if (seg.lengthSq() < 1e-6) return;
              const newLen = seg.length() / R;
              const newCenter = fixedEnd
                .clone()
                .add(seg.clone().multiplyScalar(0.5));
              const newDir = seg.clone().normalize();
              const newRot = Math.atan2(
                newDir.dot(dragHandle.basis.ey),
                newDir.dot(dragHandle.basis.ex),
              );
              updateMark(mark.id, {
                local: [newCenter.x, newCenter.y, newCenter.z],
                length: Math.min(0.55, Math.max(0.04, newLen)),
                rotation: ((newRot % Math.PI) + Math.PI) % Math.PI,
              });
            } else if (dragHandle.handleType === "width") {
              const perpDist = Math.abs(u * -Math.sin(rot) + v * Math.cos(rot));
              const newSize = Math.min(
                0.09,
                Math.max(0.01, perpDist / (0.6 * R)),
              );
              updateMark(mark.id, { size: newSize });
            }
          }
        }
        return;
      }
      if (downPoint) {
        const dx = Math.abs(e.clientX - downPoint.x);
        const dy = Math.abs(e.clientY - downPoint.y);
        if (dx > 5 || dy > 5) downPoint.moved = true;
      }
    };

    const onPointerUp = (e) => {
      if (dragHandle) {
        dragHandle = null;
        t.controls.enabled = true;
        el.releasePointerCapture?.(e.pointerId);
        return;
      }
      if (!downPoint) return;
      const wasTap =
        !downPoint.moved && performance.now() - downPoint.time < 400;
      downPoint = null;
      if (!wasTap) return;

      const rect = el.getBoundingClientRect();
      t.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      t.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      t.raycaster.setFromCamera(t.pointer, t.camera);

      const hitMark = getHitMark();
      if (hitMark) {
        // Toggle selection
        setSelectedMarkId((prev) => (prev === hitMark ? null : hitMark));
        setAutoSpin(false);
        return;
      }
      if (activeTypeRef.current) {
        const carHit = getHitCarPoint();
        if (carHit) {
          const newMark = makeMark(
            [carHit.localPt.x, carHit.localPt.y, carHit.localPt.z],
            [carHit.normal.x, carHit.normal.y, carHit.normal.z],
            activeTypeRef.current,
          );
          setMarks((prev) => [...prev, newMark]);
          setSelectedMarkId(newMark.id);
          setAutoSpin(false);
          toast.success("Schaden gesetzt");
        }
      } else {
        setSelectedMarkId(null);
      }
    };

    el.addEventListener("pointerdown", onPointerDown);
    el.addEventListener("pointermove", onPointerMove);
    el.addEventListener("pointerup", onPointerUp);
    return () => {
      el.removeEventListener("pointerdown", onPointerDown);
      el.removeEventListener("pointermove", onPointerMove);
      el.removeEventListener("pointerup", onPointerUp);
      t.controls.enabled = true;
    };
  }, [modelReady, activeVehicleId, updateMark, setMarks]);

  const counts = useMemo(
    () =>
      DAMAGE_TYPES.map((t) => ({
        ...t,
        n: marks.filter((m) => m.type === t.id).length,
      })),
    [marks],
  );
  const globalsCount =
    Object.values(activeGlobals.actions || {}).filter(Boolean).length +
    (activeGlobals.custom?.length || 0);
  const selectedMark = marks.find((m) => m.id === selectedMarkId);

  // JSX (same as original, uses activeType and selectedMarkId)
  return (
    <div style={fontStack} className="min-h-screen bg-[#fafafa] text-zinc-900">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-64"
        style={{
          background:
            "radial-gradient(80% 100% at 50% 0%, rgba(99,102,241,.08), transparent 70%)",
        }}
      />
      <div className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 py-5">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 text-white shadow-sm">
              <FiTarget size={18} />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold leading-tight tracking-tight">
                Lackier-Inspektion{" "}
                <span className="font-normal text-zinc-400">3D</span>
              </h1>
              <p className="text-[11px] text-zinc-500">
                Fahrzeug wählen oder anlegen · Schäden markieren · an die
                Werkstatt übergeben
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!activeVehicle}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40"
            >
              <FiSave size={14} /> Speichern
            </button>
            <button
              onClick={handlePrint}
              disabled={!activeVehicle}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50 disabled:opacity-40"
            >
              <FiPrinter size={14} /> Auftrag
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr_340px]">
          <VehicleTree
            brands={BRANDS}
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSelect={setActiveVehicleId}
            onAdd={() => setShowAddVehicle(true)}
            onDeleteVehicle={deleteVehicle}
            marksByVehicle={marksByVehicle}
          />

          <div className="flex flex-col gap-4">
            <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(24,24,27,.06),0_12px_40px_-12px_rgba(24,24,27,.12)]">
              <div
                ref={mountRef}
                className="relative aspect-[16/9] w-full touch-none"
                style={{
                  background: "linear-gradient(180deg,#ffffff 0%,#f4f4f5 100%)",
                  cursor: activeType ? "crosshair" : "default",
                }}
              >
                {!activeVehicle && three.current.initialized && (
                  <div className="absolute inset-0 grid place-items-center px-6">
                    <div className="flex max-w-xs flex-col items-center gap-3 text-center">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-zinc-100 text-zinc-400">
                        <FiTruck size={22} />
                      </div>
                      <p className="text-xs text-zinc-500">
                        Kein Fahrzeug gewählt. Wähle links ein Fahrzeug oder
                        lege ein neues an.
                      </p>
                      <button
                        onClick={() => setShowAddVehicle(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        <FiPlusCircle size={14} /> Fahrzeug anlegen
                      </button>
                    </div>
                  </div>
                )}
                {activeVehicle && !three.current.modelRoot && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
                  </div>
                )}
                {activeVehicle && three.current.modelRoot && (
                  <>
                    <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${activeType ? "bg-indigo-600 text-white" : "border border-zinc-200 bg-white/90 text-zinc-600"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${activeType ? "bg-white" : "bg-zinc-400"}`}
                        />
                        {activeType
                          ? `Markieren: ${DAMAGE_TYPES.find((x) => x.id === activeType)?.label || "Schaden"}`
                          : "Nur Ansicht"}
                      </span>
                      <span className="rounded-full border border-zinc-200 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-zinc-600 shadow-sm">
                        {activeBrand?.label} · {activeVehicle.name}
                      </span>
                    </div>
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
                        onClick={() => setActiveType(null)}
                        active={false}
                        title="Markier-Modus deaktivieren"
                      >
                        <FiCrosshair size={15} />
                      </ViewerBtn>
                      <ViewerBtn
                        onClick={resetView}
                        title="Ansicht zurücksetzen"
                      >
                        <FiMaximize size={15} />
                      </ViewerBtn>
                    </div>
                    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                      <span className="rounded-full border border-zinc-200/70 bg-white/85 px-3 py-1 text-[11px] text-zinc-500 backdrop-blur-sm">
                        {activeType
                          ? "Klicken setzt Schaden · Ziehen dreht die Ansicht · Scrollen zoomt"
                          : "Ziehen zum Drehen · Scrollen zum Zoomen · Klick auf Markierung zum Auswählen"}
                      </span>
                    </div>
                    {marks.length > 0 && (
                      <div className="absolute bottom-3 left-4 flex flex-wrap gap-2">
                        {counts
                          .filter((c) => c.n > 0)
                          .map((c) => (
                            <span
                              key={c.id}
                              className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-white/90 px-2 py-0.5 text-[10px] font-medium text-zinc-600 backdrop-blur-sm"
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
                  </>
                )}
              </div>
            </section>

            {activeVehicle && (
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center gap-2">
                    <FiTruck className="text-zinc-400" size={14} />
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                      Fahrzeugdetails
                    </h2>
                  </div>
                  <div className="space-y-2 text-xs">
                    <DetailRow
                      label="Marke"
                      value={activeBrand?.label || "—"}
                    />
                    <DetailRow
                      label="Modell / Bezeichnung"
                      value={activeVehicle.name || "—"}
                    />
                    <DetailRow
                      label="FIN"
                      value={activeVehicle.fin || "—"}
                      mono
                    />
                    <DetailRow label="Markierungen" value={`${marks.length}`} />
                  </div>
                </div>
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FiClipboard className="text-zinc-400" size={14} />
                      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        Aufgaben · {marks.length + globalsCount}
                      </h2>
                    </div>
                    {(marks.length > 0 || globalsCount > 0) && (
                      <button
                        onClick={clearAllTasks}
                        className="text-[11px] font-medium text-red-600 hover:text-red-700"
                      >
                        Alle löschen
                      </button>
                    )}
                  </div>
                  {marks.length === 0 && globalsCount === 0 ? (
                    <p className="py-2 text-[11px] text-zinc-400">
                      Noch keine Aufgaben.
                    </p>
                  ) : (
                    <ul className="-mx-1 max-h-72 space-y-0.5 overflow-auto px-1">
                      {Object.entries(activeGlobals.actions || {})
                        .filter(([, on]) => on)
                        .map(([id]) => {
                          const g = GLOBAL_ACTIONS.find((x) => x.id === id);
                          return (
                            <li
                              key={`g_${id}`}
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs hover:bg-zinc-50"
                            >
                              <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-md bg-indigo-600 text-[10px] text-white">
                                {g?.icon}
                              </span>
                              <span className="flex-1 truncate font-semibold text-zinc-700">
                                {g?.label}
                              </span>
                              <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-indigo-700">
                                Gesamt
                              </span>
                              <button
                                onClick={() => toggleGlobal(id)}
                                className="text-zinc-300 hover:text-red-500"
                              >
                                <FiX size={12} />
                              </button>
                            </li>
                          );
                        })}
                      {activeGlobals.custom?.map((c, i) => (
                        <li
                          key={`gc_${i}`}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs hover:bg-zinc-50"
                        >
                          <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-md bg-zinc-900 text-[10px] text-white">
                            ★
                          </span>
                          <span className="flex-1 truncate font-semibold text-zinc-700">
                            {c}
                          </span>
                          <span className="rounded bg-zinc-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-zinc-600">
                            Gesamt
                          </span>
                          <button
                            onClick={() => removeCustomGlobal(i)}
                            className="text-zinc-300 hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </li>
                      ))}
                      {marks.map((m, idx) => {
                        const dt = DAMAGE_TYPES.find((d) => d.id === m.type);
                        const sv = SEVERITY.find((s) => s.id === m.severity);
                        const on = selectedMarkId === m.id;
                        return (
                          <li
                            key={m.id}
                            onClick={() => selectMark(m.id)}
                            className={`group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${on ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-zinc-50"}`}
                          >
                            <span
                              className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                              style={{ background: dt?.color }}
                            >
                              {idx + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="flex items-center gap-1.5">
                                <span className="font-semibold text-zinc-700">
                                  {m.action}
                                </span>
                                <span className="h-1 w-1 rounded-full bg-zinc-300" />
                                <span className="truncate text-zinc-500">
                                  {m.panel || dt?.label}
                                </span>
                              </span>
                              {m.note && (
                                <span className="block truncate text-[10.5px] text-zinc-400">
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
                              className="flex-shrink-0 text-zinc-300 opacity-0 transition group-hover:opacity-100"
                              size={13}
                            />
                          </li>
                        );
                      })}
                    </ul>
                  )}
                  {marks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3 border-t border-zinc-100 pt-3">
                      {SEVERITY.map((s) => {
                        const n = marks.filter(
                          (m) => m.severity === s.id,
                        ).length;
                        if (!n) return null;
                        return (
                          <span
                            key={s.id}
                            className="inline-flex items-center gap-1 text-[11px] font-semibold"
                            style={{ color: s.color }}
                          >
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ background: s.color }}
                            />
                            {n} {s.label}
                          </span>
                        );
                      })}
                    </div>
                  )}
                </div>
              </section>
            )}
          </div>

          <aside className="flex flex-col gap-4">
            <Panel title="1 · Schadensart wählen">
              <div className="mb-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-[11px] leading-relaxed text-zinc-500">
                Keine Art ist automatisch ausgewählt. Wähle eine Art zum
                Markieren, klicke sie erneut zum Abwählen. Ziehen dreht weiter
                das Fahrzeug.
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {DAMAGE_TYPES.map((t) => {
                  const on = activeType === t.id;
                  const n = counts.find((c) => c.id === t.id)?.n || 0;
                  return (
                    <button
                      key={t.id}
                      onClick={() =>
                        setActiveType((cur) => (cur === t.id ? null : t.id))
                      }
                      className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-medium transition ${on ? "border-indigo-600 bg-indigo-50 text-indigo-700 shadow-sm" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"}`}
                    >
                      <span className="flex items-center gap-2">
                        <span
                          className={`h-2.5 w-2.5 rounded-full ${on ? "ring-2 ring-indigo-200" : ""}`}
                          style={{ background: t.color }}
                        />
                        {t.label}
                      </span>
                      {n > 0 && (
                        <span
                          className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${on ? "bg-indigo-100 text-indigo-700" : "bg-zinc-100 text-zinc-500"}`}
                        >
                          {n}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={() => setActiveType(null)}
                className="mt-2 w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-[11px] font-medium text-zinc-500 transition hover:bg-zinc-50 hover:text-zinc-700"
              >
                Auswahl aufheben
              </button>
            </Panel>

            {selectedMark ? (
              <Panel
                title="2 · Maßnahme & Größe"
                action={
                  <button
                    onClick={() => setSelectedMarkId(null)}
                    className="text-zinc-400 hover:text-zinc-600"
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
                            updateMark(selectedMark.id, {
                              type: t.id,
                              length: ELONGATED.has(t.id)
                                ? Math.max(selectedMark.length || 0.14, 0.1)
                                : selectedMark.size,
                            })
                          }
                          title={t.label}
                          className="h-7 w-7 rounded-full border-2 transition"
                          style={{
                            background: t.color,
                            borderColor:
                              selectedMark.type === t.id
                                ? "#0f172a"
                                : "transparent",
                          }}
                        />
                      ))}
                    </div>
                  </Field>
                  {(() => {
                    const isE = ELONGATED.has(selectedMark.type);
                    const cm = (f) => (f * 200).toFixed(f < 0.05 ? 1 : 0);
                    const presets = isE
                      ? [
                          ["S", 0.1],
                          ["M", 0.2],
                          ["L", 0.35],
                        ]
                      : [
                          ["S", 0.05],
                          ["M", 0.1],
                          ["L", 0.2],
                        ];
                    return (
                      <div className="rounded-xl border border-zinc-200 bg-zinc-50/70 p-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700">
                          <FiCrosshair size={13} /> Direkt am Fahrzeug ziehen
                        </div>
                        <p className="mt-1 text-[11px] leading-relaxed text-zinc-500">
                          {isE
                            ? "Die beiden End-Griffe ziehen für Länge & Richtung, den seitlichen Griff für die Breite."
                            : "Den Griff am Rand ziehen, um die Größe einzustellen."}{" "}
                          Griffe oder Schnellgrößen benutzen. Mausrad bleibt nur
                          für Zoom.
                        </p>
                        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
                          {isE ? (
                            <>
                              <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200">
                                Länge {cm(selectedMark.length)} cm
                              </span>
                              <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200">
                                Breite {cm(selectedMark.size)} cm
                              </span>
                            </>
                          ) : (
                            <span className="rounded-md bg-white px-2 py-1 text-[11px] font-semibold text-zinc-700 ring-1 ring-zinc-200">
                              Ø {cm(selectedMark.size)} cm
                            </span>
                          )}
                        </div>
                        <div className="mt-2.5 flex items-center gap-1.5">
                          <span className="text-[10px] uppercase tracking-wide text-zinc-400">
                            Schnell
                          </span>
                          {presets.map(([lbl, val]) => (
                            <button
                              key={lbl}
                              onClick={() =>
                                updateMark(
                                  selectedMark.id,
                                  isE ? { length: val } : { size: val },
                                )
                              }
                              className="grid h-6 w-7 place-items-center rounded-md border border-zinc-200 bg-white text-[11px] font-medium text-zinc-600 transition hover:border-indigo-300 hover:text-indigo-700"
                            >
                              {lbl}
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}
                  <Field label="Maßnahme">
                    <Select
                      value={selectedMark.action}
                      onChange={(v) =>
                        updateMark(selectedMark.id, { action: v })
                      }
                      options={ACTIONS}
                    />
                  </Field>
                  <Field label="Bauteil">
                    <Select
                      value={selectedMark.panel}
                      onChange={(v) =>
                        updateMark(selectedMark.id, { panel: v })
                      }
                      options={["", ...PANELS]}
                      placeholder="(optional)"
                    />
                  </Field>
                  <Field label="Schweregrad">
                    <div className="grid grid-cols-3 gap-1.5">
                      {SEVERITY.map((s) => {
                        const on = selectedMark.severity === s.id;
                        return (
                          <button
                            key={s.id}
                            onClick={() =>
                              updateMark(selectedMark.id, { severity: s.id })
                            }
                            className={`rounded-lg border px-2 py-1.5 text-[11px] font-semibold transition ${on ? "text-white shadow-sm" : "border-zinc-200 bg-white text-zinc-600 hover:bg-zinc-50"}`}
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
                      value={selectedMark.note}
                      onChange={(e) =>
                        updateMark(selectedMark.id, { note: e.target.value })
                      }
                      placeholder="z. B. tiefer Kratzer, ca. 15 cm …"
                      rows={2}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </Field>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => flyToMark(selectedMark)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-600 hover:text-indigo-700"
                    >
                      <FiTarget size={13} /> Zur Stelle springen
                    </button>
                    <button
                      onClick={() => deleteMark(selectedMark.id)}
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
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-400">
                    <FiCrosshair size={18} />
                  </div>
                  <p className="max-w-[210px] text-[11px] leading-relaxed text-zinc-400">
                    {activeVehicle
                      ? "Wähle eine Markierung, um Größe, Ausrichtung und Maßnahme festzulegen."
                      : "Wähle zuerst ein Fahrzeug."}
                  </p>
                </div>
              </Panel>
            )}

            {activeVehicle && (
              <Panel title="Gesamtfahrzeug-Maßnahmen">
                <div className="grid grid-cols-2 gap-1.5">
                  {GLOBAL_ACTIONS.map((g) => {
                    const on = !!activeGlobals.actions?.[g.id];
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGlobal(g.id)}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition ${on ? "border-indigo-600 bg-indigo-50 text-indigo-700" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"}`}
                      >
                        <span className="text-base leading-none">{g.icon}</span>
                        <span className="flex-1">{g.label}</span>
                        {on && (
                          <span className="h-1.5 w-1.5 rounded-full bg-indigo-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
                <div className="mt-2 flex gap-1.5">
                  <input
                    value={customGlobalInput}
                    onChange={(e) => setCustomGlobalInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addCustomGlobal()}
                    placeholder="Eigene Maßnahme hinzufügen…"
                    className="flex-1 rounded-lg border border-zinc-200 px-2.5 py-1.5 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    onClick={addCustomGlobal}
                    disabled={!customGlobalInput.trim()}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-zinc-900 text-white transition hover:bg-black disabled:opacity-40"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                {activeGlobals.custom?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeGlobals.custom.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2 py-1 text-[11px] text-zinc-700"
                      >
                        {c}
                        <button
                          onClick={() => removeCustomGlobal(i)}
                          className="text-zinc-400 hover:text-red-500"
                        >
                          <FiX size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Panel>
            )}
          </aside>
        </div>
      </div>
      {showAddVehicle && (
        <AddVehicleModal
          brands={BRANDS}
          onClose={() => setShowAddVehicle(false)}
          onAdd={addVehicle}
        />
      )}
    </div>
  );
}

// ========== HELPER COMPONENTS AND FUNCTIONS (unchanged from your original) ==========
function VehicleTree({
  brands,
  vehicles,
  activeVehicleId,
  onSelect,
  onAdd,
  onDeleteVehicle,
  marksByVehicle,
}) {
  const [query, setQuery] = useState("");
  const [openBrands, setOpenBrands] = useState({});
  const byBrand = useMemo(() => {
    const g = {};
    brands.forEach((b) => (g[b.id] = []));
    vehicles.forEach((v) => {
      if (
        !query ||
        `${v.name} ${v.fin}`.toLowerCase().includes(query.toLowerCase())
      )
        (g[v.brandId] ||= []).push(v);
    });
    return g;
  }, [brands, vehicles, query]);
  useEffect(() => {
    const v = vehicles.find((x) => x.id === activeVehicleId);
    if (v) setOpenBrands((p) => ({ ...p, [v.brandId]: true }));
  }, [activeVehicleId, vehicles]);
  const toggle = (id) => setOpenBrands((p) => ({ ...p, [id]: !p[id] }));
  return (
    <aside className="flex flex-col rounded-2xl border border-zinc-200 bg-white shadow-sm">
      <div className="flex items-center justify-between border-b px-3.5 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider">
          Fahrzeuge
        </h2>
        <button
          onClick={onAdd}
          className="inline-flex items-center gap-1 rounded-md bg-indigo-600 px-2 py-1 text-[10px] font-semibold text-white"
        >
          <FiPlus size={12} /> Neu
        </button>
      </div>
      <div className="px-3 pt-3">
        <div className="relative">
          <FiSearch
            className="absolute left-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
            size={13}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen…"
            className="h-8 w-full rounded-lg border border-zinc-200 pl-7 pr-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 placeholder:text-zinc-400"
          />
        </div>
      </div>
      <div className="flex-1 overflow-auto p-2">
        {brands.map((brand) => {
          const cars = byBrand[brand.id] || [];
          const open = openBrands[brand.id] ?? false;
          return (
            <div key={brand.id}>
              <button
                onClick={() => toggle(brand.id)}
                className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
              >
                {open ? (
                  <FiChevronDown size={13} className="text-zinc-400" />
                ) : (
                  <FiChevronRight size={13} className="text-zinc-400" />
                )}
                {open ? (
                  <FiFolderPlus size={15} className="text-indigo-500" />
                ) : (
                  <FiFolder size={15} className="text-zinc-400" />
                )}
                <span className="flex-1 truncate">{brand.label}</span>
                <span className="rounded-full bg-zinc-100 px-1.5 py-0.5 text-[9px] tabular-nums text-zinc-500">
                  {cars.length}
                </span>
              </button>
              {open &&
                (cars.length === 0 ? (
                  <p className="ml-7 py-1.5 text-[10.5px] text-zinc-400">
                    Noch keine Fahrzeuge.
                  </p>
                ) : (
                  <ul className="ml-3 border-l border-zinc-100 pl-1.5">
                    {cars.map((v) => {
                      const on = v.id === activeVehicleId;
                      const n = marksByVehicle[v.id]?.length || 0;
                      return (
                        <li key={v.id} className="group/leaf">
                          <div
                            className={`flex items-center gap-1 rounded-lg pr-1 transition ${on ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-zinc-50"}`}
                          >
                            <button
                              onClick={() => onSelect(v.id)}
                              className={`flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs ${on ? "font-medium text-indigo-700" : "text-zinc-600"}`}
                            >
                              <FiTruck
                                size={13}
                                className={`flex-shrink-0 ${on ? "text-indigo-500" : "text-zinc-400"}`}
                              />
                              <span className="min-w-0 flex-1">
                                <span className="block truncate">{v.name}</span>
                                {v.fin && (
                                  <span className="block truncate text-[9.5px] font-normal text-zinc-400">
                                    {v.fin}
                                  </span>
                                )}
                              </span>
                              {n > 0 && (
                                <span
                                  className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] tabular-nums ${on ? "bg-indigo-100 text-indigo-600" : "bg-zinc-100 text-zinc-500"}`}
                                >
                                  {n}
                                </span>
                              )}
                            </button>
                            <button
                              onClick={() => onDeleteVehicle(v.id)}
                              title="Entfernen"
                              className="flex-shrink-0 rounded p-1 text-zinc-300 opacity-0 transition hover:text-red-500 group-hover/leaf:opacity-100"
                            >
                              <FiTrash2 size={12} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                ))}
            </div>
          );
        })}
      </div>
      <div className="border-t border-zinc-100 px-3.5 py-2.5">
        <p className="text-[10px] leading-relaxed text-zinc-400">
          Marken-Modelle definierst du in{" "}
          <code className="rounded bg-zinc-100 px-1 text-[9px]">BRANDS</code>.
          Fahrzeuge legst du hier mit „Neu" an.
        </p>
      </div>
    </aside>
  );
}

function AddVehicleModal({ brands, onClose, onAdd }) {
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [name, setName] = useState("");
  const [fin, setFin] = useState("");
  const valid = brandId && name.trim();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-zinc-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-zinc-800">
            Neues Fahrzeug
          </h3>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600"
          >
            <FiX size={16} />
          </button>
        </div>
        <div className="space-y-3.5 px-5 py-4">
          <Field label="Marke">
            <Select
              value={brandId}
              onChange={setBrandId}
              options={brands.map((b) => b.id)}
              render={(id) => brands.find((b) => b.id === id)?.label || id}
            />
          </Field>
          <Field label="Modell / Bezeichnung">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. C-Klasse, GLK 220 CDI"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </Field>
          <Field label="FIN (optional)">
            <input
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              placeholder="z. B. WDC2049811A123456"
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs font-mono outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
            />
          </Field>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Abbrechen
          </button>
          <button
            onClick={() => valid && onAdd({ brandId, name, fin })}
            disabled={!valid}
            className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700 disabled:opacity-40"
          >
            Hinzufügen
          </button>
        </div>
      </div>
    </div>
  );
}

function Panel({ title, action, children }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
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
      <label className="mb-1 block text-[10.5px] font-medium uppercase tracking-wide text-zinc-400">
        {label}
      </label>
      {children}
    </div>
  );
}
function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-zinc-400">{label}</span>
      <span
        className={`font-medium text-zinc-700 ${mono ? "font-mono text-[11px]" : ""} truncate`}
      >
        {value}
      </span>
    </div>
  );
}
function Select({ value, onChange, options, placeholder, render }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded-lg border border-zinc-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-zinc-700 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
      >
        {options.map((o) => (
          <option key={o || "_"} value={o}>
            {render ? render(o) : o === "" ? placeholder || "—" : o}
          </option>
        ))}
      </select>
      <FiChevronDown
        className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-400"
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
      className={`grid h-9 w-9 place-items-center rounded-lg border shadow-sm backdrop-blur-sm transition ${active ? "border-indigo-600 bg-indigo-600 text-white" : "border-zinc-200 bg-white/90 text-zinc-600 hover:bg-white"}`}
    >
      {children}
    </button>
  );
}
const fontStack = {
  fontFamily:
    "'Söhne','Geist','Manrope',ui-sans-serif,system-ui,-apple-system,sans-serif",
};

// Texture and visual helpers (exactly as your original – long but required)
function buildDamageTextures(THREE) {
  const S = 512;
  const tex = (draw) => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, S, S);
    draw(ctx, S);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 4;
    return t;
  };
  const scratch = tex((ctx, S) => {
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (let i = 0; i < 7; i++) {
      const y = S * (0.42 + (Math.random() - 0.5) * 0.18);
      const x1 = S * (0.16 + Math.random() * 0.08);
      const x2 = S * (0.84 - Math.random() * 0.08);
      ctx.strokeStyle = i < 2 ? "rgba(255,255,255,.9)" : "rgba(15,23,42,.72)";
      ctx.lineWidth = i < 2 ? 2.2 : 1.2 + Math.random() * 1.5;
      ctx.beginPath();
      ctx.moveTo(x1, y);
      ctx.bezierCurveTo(
        S * 0.35,
        y + (Math.random() - 0.5) * 20,
        S * 0.62,
        y + (Math.random() - 0.5) * 18,
        x2,
        y + (Math.random() - 0.5) * 10,
      );
      ctx.stroke();
    }
  });
  const dent = tex((ctx, S) => {
    const g = ctx.createRadialGradient(
      S / 2,
      S / 2,
      S * 0.03,
      S / 2,
      S / 2,
      S * 0.36,
    );
    g.addColorStop(0, "rgba(0,0,0,.38)");
    g.addColorStop(0.45, "rgba(0,0,0,.13)");
    g.addColorStop(0.7, "rgba(255,255,255,.18)");
    g.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.ellipse(S / 2, S / 2, S * 0.34, S * 0.22, -0.35, 0, Math.PI * 2);
    ctx.fill();
  });
  const paint = tex((ctx, S) => {
    ctx.fillStyle = "rgba(225,29,72,.85)";
    ctx.beginPath();
    ctx.moveTo(S * 0.28, S * 0.34);
    ctx.bezierCurveTo(S * 0.43, S * 0.22, S * 0.7, S * 0.3, S * 0.73, S * 0.46);
    ctx.bezierCurveTo(
      S * 0.77,
      S * 0.65,
      S * 0.47,
      S * 0.76,
      S * 0.3,
      S * 0.62,
    );
    ctx.bezierCurveTo(
      S * 0.18,
      S * 0.51,
      S * 0.18,
      S * 0.42,
      S * 0.28,
      S * 0.34,
    );
    ctx.fill();
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = "rgba(0,0,0,.45)";
    for (let i = 0; i < 10; i++) {
      ctx.beginPath();
      ctx.arc(
        S * (0.35 + Math.random() * 0.3),
        S * (0.4 + Math.random() * 0.2),
        3 + Math.random() * 8,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.globalCompositeOperation = "source-over";
  });
  const rust = tex((ctx, S) => {
    const colors = [
      "rgba(120,53,15,.75)",
      "rgba(180,83,9,.75)",
      "rgba(217,119,6,.55)",
      "rgba(69,26,3,.45)",
    ];
    for (let i = 0; i < 70; i++) {
      ctx.fillStyle = colors[i % colors.length];
      ctx.beginPath();
      ctx.arc(
        S * (0.25 + Math.random() * 0.5),
        S * (0.28 + Math.random() * 0.44),
        3 + Math.random() * 16,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });
  const crack = tex((ctx, S) => {
    ctx.strokeStyle = "rgba(17,24,39,.9)";
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.lineWidth = 4;
    let x = S * 0.18;
    let y = S * 0.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    for (let i = 0; i < 8; i++) {
      x += S * 0.08;
      y += (Math.random() - 0.5) * S * 0.12;
      ctx.lineTo(x, y);
      if (i === 2 || i === 5) {
        ctx.moveTo(x, y);
        ctx.lineTo(x + S * 0.08, y + (Math.random() > 0.5 ? 1 : -1) * S * 0.12);
        ctx.moveTo(x, y);
      }
    }
    ctx.stroke();
  });
  const other = tex((ctx, S) => {
    ctx.fillStyle = "rgba(82,82,91,.85)";
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.12, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(82,82,91,.55)";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S * 0.24, 0, Math.PI * 2);
    ctx.stroke();
  });
  return { scratch, dent, paint, rust, crack, other };
}

function addMarkVisual(t, group, spec, number, isSel, draft) {
  const { THREE, textures } = t;
  const type = DAMAGE_TYPES.find((x) => x.id === spec.type);
  const color = type?.color || "#111827";
  const pos = new THREE.Vector3(...spec.local);
  const nrm = new THREE.Vector3(...(spec.normal || [0, 0, 1])).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    nrm,
  );
  const cl = (v, a, b) => Math.min(b, Math.max(a, v));
  const R = t.localCarRadius || 2;
  const isElong = ELONGATED.has(spec.type);
  const sizeFrac = cl(spec.size || 0.06, 0.018, 0.28);
  const lenFrac = cl(spec.length || sizeFrac, 0.04, 0.55);
  const width = isElong ? lenFrac * R : sizeFrac * R;
  const height = isElong ? sizeFrac * 0.55 * R : sizeFrac * R;
  const offset = R * 0.005;
  const surfacePos = pos.clone().add(nrm.clone().multiplyScalar(offset));
  const markId = spec.id;
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 2, height * 2),
    new THREE.MeshBasicMaterial({
      map: textures[spec.type] || textures.other,
      transparent: true,
      depthWrite: false,
      depthTest: true,
      polygonOffset: true,
      polygonOffsetFactor: -8,
      polygonOffsetUnits: -8,
      opacity: draft ? 0.72 : isSel ? 0.96 : 0.84,
    }),
  );
  decal.position.copy(surfacePos);
  decal.quaternion.copy(quat);
  decal.rotateZ(spec.rotation || 0);
  decal.userData.markId = markId;
  decal.renderOrder = 10;
  group.add(decal);
  if (isSel || draft) {
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(
        isElong ? width * 2.35 : width * 2.25,
        isElong ? height * 2.75 : height * 2.25,
      ),
      new THREE.MeshBasicMaterial({
        map: softHaloTexture(THREE, color),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        opacity: draft ? 0.35 : 0.28,
      }),
    );
    halo.position.copy(pos).add(nrm.clone().multiplyScalar(offset + R * 0.001));
    halo.quaternion.copy(quat);
    halo.rotateZ(spec.rotation || 0);
    halo.userData.markId = markId;
    halo.renderOrder = 11;
    group.add(halo);
  }
  const dot = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: tinyAnchorTexture(THREE, color, isSel),
      depthTest: false,
      transparent: true,
    }),
  );
  const dotSize = R * (isSel ? 0.032 : 0.024);
  dot.scale.set(dotSize, dotSize, 1);
  dot.position.copy(surfacePos);
  dot.userData.markId = markId;
  dot.renderOrder = 18;
  group.add(dot);
  if (number == null) return;
  const badge = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: compactBadgeTexture(THREE, number, color, isSel),
      depthTest: false,
      transparent: true,
    }),
  );
  const badgeSize = R * (isSel ? 0.105 : 0.082);
  const tangentLift = Math.max(width, height) * 0.8 + R * 0.055;
  const badgePos = surfacePos.clone().add(new THREE.Vector3(0, tangentLift, 0));
  badge.center.set(0.5, 0.5);
  badge.scale.set(badgeSize, badgeSize, 1);
  badge.position.copy(badgePos);
  badge.userData.markId = markId;
  badge.renderOrder = 22;
  group.add(badge);
}
function softHaloTexture(THREE, color) {
  const S = 256;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(
    S / 2,
    S / 2,
    S * 0.18,
    S / 2,
    S / 2,
    S * 0.5,
  );
  g.addColorStop(0, "rgba(255,255,255,0)");
  g.addColorStop(0.55, "rgba(255,255,255,0)");
  g.addColorStop(0.78, hexToRgba(color, 0.34));
  g.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.userData = { ephemeral: true };
  return t;
}
function tinyAnchorTexture(THREE, color, selected) {
  const S = 96;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const cx = S / 2,
    cy = S / 2;
  ctx.fillStyle = "rgba(255,255,255,.82)";
  ctx.beginPath();
  ctx.arc(cx, cy, selected ? S * 0.22 : S * 0.18, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, selected ? S * 0.13 : S * 0.1, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.userData = { ephemeral: true };
  return t;
}
function compactBadgeTexture(THREE, n, color, selected) {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const cx = S / 2,
    cy = S / 2;
  const r = selected ? 38 : 33;
  ctx.save();
  ctx.shadowColor = "rgba(15,23,42,.25)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "rgba(255,255,255,.92)";
  ctx.beginPath();
  ctx.arc(cx, cy, r + 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#fff";
  ctx.font = `700 ${selected ? 42 : 38}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n), cx, cy + 1);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.userData = { ephemeral: true };
  return t;
}
function hexToRgba(hex, alpha) {
  const h = String(hex).replace("#", "");
  const full =
    h.length === 3
      ? h
          .split("")
          .map((x) => x + x)
          .join("")
      : h;
  const num = parseInt(full, 16);
  const r = (num >> 16) & 255,
    g = (num >> 8) & 255,
    b = num & 255;
  return `rgba(${r},${g},${b},${alpha})`;
}
function addHandles(t, group, m) {
  const { THREE } = t;
  const nrm = new THREE.Vector3(...(m.normal || [0, 0, 1])).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    nrm,
  );
  const ex = new THREE.Vector3(1, 0, 0).applyQuaternion(q);
  const ey = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
  const center = new THREE.Vector3(...m.local);
  const R = t.localCarRadius || 2;
  const lift = nrm.clone().multiplyScalar(R * 0.008);
  const knobSize = R * 0.045;
  const addKnob = (localPos, handle, accent) => {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: handleKnobTexture(THREE, accent),
        depthTest: false,
        transparent: true,
      }),
    );
    sp.scale.set(knobSize, knobSize, 1);
    sp.position.copy(localPos).add(lift);
    sp.userData.handle = handle;
    sp.userData.markId = m.id;
    sp.renderOrder = 26;
    group.add(sp);
  };
  const addGuide = (a, b) => {
    const ln = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        a.clone().add(lift),
        b.clone().add(lift),
      ]),
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#4f46e5"),
        transparent: true,
        opacity: 0.22,
        depthTest: false,
      }),
    );
    ln.renderOrder = 25;
    group.add(ln);
  };
  if (!ELONGATED.has(m.type)) {
    const radius = (m.size || 0.06) * R;
    const rim = center.clone().add(ex.clone().multiplyScalar(radius));
    addGuide(center, rim);
    addKnob(rim, "radius", true);
    return;
  }
  const rot = m.rotation || 0;
  const axis = ex
    .clone()
    .multiplyScalar(Math.cos(rot))
    .add(ey.clone().multiplyScalar(Math.sin(rot)));
  const perp = ex
    .clone()
    .multiplyScalar(-Math.sin(rot))
    .add(ey.clone().multiplyScalar(Math.cos(rot)));
  const half = (m.length || 0.14) * R;
  const endA = center.clone().add(axis.clone().multiplyScalar(-half));
  const endB = center.clone().add(axis.clone().multiplyScalar(half));
  const wOff = (m.size || 0.04) * 0.6 * R + R * 0.05;
  const widthH = center.clone().add(perp.clone().multiplyScalar(wOff));
  addGuide(endA, endB);
  addGuide(center, widthH);
  addKnob(endA, "endA", false);
  addKnob(endB, "endB", false);
  addKnob(widthH, "width", true);
}
function handleKnobTexture(THREE, accent) {
  const S = 96;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const cx = S / 2,
    cy = S / 2,
    r = S * 0.3;
  ctx.save();
  ctx.shadowColor = "rgba(24,24,27,0.4)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  ctx.lineWidth = 6;
  ctx.strokeStyle = "rgba(79,70,229,.75)";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  if (accent) {
    ctx.fillStyle = "rgba(79,70,229,.85)";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.userData = { ephemeral: true };
  return t;
}
function disposeMarkGroup(group) {
  while (group.children.length) {
    const c = group.children.pop();

    c.geometry?.dispose?.();

    const mats = Array.isArray(c.material) ? c.material : [c.material];

    mats.forEach((mm) => {
      if (!mm) return;

      if (mm.map && mm.map.userData && mm.map.userData.ephemeral) {
        mm.map.dispose?.();
      }

      mm.dispose?.();
    });
  }
}

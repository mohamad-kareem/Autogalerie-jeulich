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
  FiTruck,
  FiSearch,
  FiPlusCircle,
  FiClipboard,
  FiTool,
  FiDollarSign,
  FiCheckCircle,
  FiFolder,
  FiCalendar,
  FiFileText,
} from "react-icons/fi";

/* =========================================================
   BRANDS  — YOU define these. One shared .glb per brand.
   ---------------------------------------------------------
   Drop each brand's .glb in /public and reference it here.
   Every vehicle the user adds under a brand uses this model.
========================================================= */
const BRANDS = [
  {
    id: "mercedes",
    label: "Mercedes-Benz",
    model: "/uploads_files_5489305_Glk.glb",
  },
  {
    id: "mercedes1",
    label: "Mercedes-Benz1",
    model: "/mercedes.glb",
  },

  {
    id: "peugeot",
    label: "Peugeot",
    model: "/peugeot.glb",
  },
  {
    id: "ford",
    label: "Ford",
    model: "/fordfocus.glb",
  },
  {
    id: "hyundai",
    label: "Hyundai",
    model: "/hyundai.glb",
  },
  {
    id: "opel",
    label: "Opel",
    model: "/opel.glb",
  },
  {
    id: "kia",
    label: "Kia",
    model: "/kiapicanto.glb",
  },
  {
    id: "kia1",
    label: "Kia1",
    model: "/kiapicanto1.glb",
  },
  {
    id: "mazda",
    label: "Mazda",
    model: "/mazda.glb",
  },
  {
    id: "volkswagen",
    label: "Volkswagen",
    model: "/volkswagen.glb",
  },
];

/* Seed vehicles (optional). Users add more in-app. */
const SEED_VEHICLES = [
  // { id: "v1", brandId: "mercedes", name: "GLK 220 CDI", fin: "WDC2049811A123456" },
];

const DAMAGE_TYPES = [
  { id: "scratch", label: "Kratzer", color: "#0891b2" },
  { id: "dent", label: "Delle", color: "#f59e0b" },
  { id: "paint", label: "Lackschaden", color: "#e11d48" },
  { id: "rust", label: "Rost", color: "#b45309" },
  { id: "crack", label: "Riss / Bruch", color: "#7c3aed" },
  { id: "other", label: "Sonstiges", color: "#52525b" },
];
const BODYWORK_ACTIONS = [
  "Spachteln",
  "Schleifen",
  "Grundieren",
  "Lackieren",
  "Polieren",
  "Beule ausbeulen",
  "Teil tauschen",
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

const MECHANICAL_AREAS = [
  "Motor",
  "Getriebe",
  "Kupplung",
  "Bremsanlage",
  "Fahrwerk",
  "Lenkung",
  "Elektrik / Diagnose",
  "Kühlung",
  "Abgasanlage",
  "Klimaanlage",
  "Reifen / Räder",
  "Inspektion / Service",
  "Sonstiges",
];

// damage types that look like strokes (long & thin) get a length dimension
const ELONGATED = new Set(["scratch", "crack"]);

const makeMark = (local, normal, type) => ({
  id: `m_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  local,
  normal,
  type,
  action: "Lackieren",
  panel: "",
  note: "",
  price: "",
  size: 0.06, // 6% of car radius
  length: ELONGATED.has(type) ? 0.14 : 0.06, // 14% for elongated default
  rotation: 0,
});

export default function VehicleInspection3DPage() {
  // vehicles (user-managed) + selection
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || null;
  const activeBrand = activeVehicle
    ? BRANDS.find((b) => b.id === activeVehicle.brandId)
    : null;

  // per-vehicle marks
  const [marksByVehicle, setMarksByVehicle] = useState({});
  // non-visual workshop data per vehicle
  const [mechanicalByVehicle, setMechanicalByVehicle] = useState({});
  const marks = (activeVehicleId && marksByVehicle[activeVehicleId]) || [];
  const mechanicalTasks =
    (activeVehicleId && mechanicalByVehicle[activeVehicleId]) || [];
  const activeVehicleIdRef = useRef(activeVehicleId);
  activeVehicleIdRef.current = activeVehicleId;
  const setMarks = useCallback(
    (updater) =>
      setMarksByVehicle((prev) => {
        const vid = activeVehicleIdRef.current;
        if (!vid) return prev;
        const cur = prev[vid] || [];
        const next = typeof updater === "function" ? updater(cur) : updater;
        return { ...prev, [vid]: next };
      }),
    [],
  );

  const [ready, setReady] = useState(false);
  const [sceneReady, setSceneReady] = useState(false);
  const [errored, setErrored] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState("Szene wird vorbereitet");

  const [activeType, setActiveType] = useState("scratch");
  const [selectedMark, setSelectedMark] = useState(null);
  const [placing, setPlacing] = useState(true);
  const [autoSpin, setAutoSpin] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [showBillingPrint, setShowBillingPrint] = useState(false);
  const [mechanicalDraft, setMechanicalDraft] = useState({
    area: "",
    job: "",
    note: "",
    price: "",
  });

  const mountRef = useRef(null);
  const three = useRef({});
  const stateRef = useRef({});
  stateRef.current = { autoSpin, placing, activeType };
  const marksRef = useRef([]);
  marksRef.current = marks;
  const selectedMarkRef = useRef(null);
  selectedMarkRef.current = selectedMark;

  const currentModel = activeBrand?.model || null;

  const applyInspectionToState = useCallback((inspection) => {
    const id = String(inspection.id || inspection._id);
    const vehicle = {
      id,
      brandId: inspection.vehicle?.brandId || "",
      name: inspection.vehicle?.name || "",
      fin: inspection.vehicle?.fin || "",
      status: inspection.status || "draft",
      createdAt: inspection.createdAt,
      updatedAt: inspection.updatedAt,
    };

    setVehicles((current) => {
      const exists = current.some((item) => item.id === id);
      return exists
        ? current.map((item) => (item.id === id ? vehicle : item))
        : [vehicle, ...current];
    });
    setMarksByVehicle((current) => ({
      ...current,
      [id]: Array.isArray(inspection.bodywork) ? inspection.bodywork : [],
    }));
    setMechanicalByVehicle((current) => ({
      ...current,
      [id]: Array.isArray(inspection.mechanicalTasks)
        ? inspection.mechanicalTasks
        : [],
    }));
    return vehicle;
  }, []);

  useEffect(() => {
    const controller = new AbortController();

    const loadInspections = async () => {
      try {
        setDataLoading(true);
        const response = await fetch("/api/workshop-inspections", {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(
            data.message || "Werkstattaufträge konnten nicht geladen werden.",
          );
        }

        const inspections = Array.isArray(data.inspections)
          ? data.inspections
          : [];
        const nextVehicles = [];
        const nextMarks = {};
        const nextMechanical = {};

        inspections.forEach((inspection) => {
          const id = String(inspection.id || inspection._id);
          nextVehicles.push({
            id,
            brandId: inspection.vehicle?.brandId || "",
            name: inspection.vehicle?.name || "",
            fin: inspection.vehicle?.fin || "",
            status: inspection.status || "draft",
            createdAt: inspection.createdAt,
            updatedAt: inspection.updatedAt,
          });
          nextMarks[id] = Array.isArray(inspection.bodywork)
            ? inspection.bodywork
            : [];
          nextMechanical[id] = Array.isArray(inspection.mechanicalTasks)
            ? inspection.mechanicalTasks
            : [];
        });

        setVehicles(nextVehicles);
        setMarksByVehicle(nextMarks);
        setMechanicalByVehicle(nextMechanical);
        setActiveVehicleId((current) =>
          current && nextVehicles.some((vehicle) => vehicle.id === current)
            ? current
            : nextVehicles[0]?.id || null,
        );
      } catch (error) {
        if (error.name !== "AbortError") {
          console.error(error);
          toast.error(error.message || "Daten konnten nicht geladen werden.");
        }
      } finally {
        if (!controller.signal.aborted) setDataLoading(false);
      }
    };

    loadInspections();
    return () => controller.abort();
  }, []);

  /* ============ THREE setup once ============ */
  useEffect(() => {
    let disposed = false;
    let cleanup = () => {};
    (async () => {
      try {
        const THREE = await import("three");
        const { OrbitControls } =
          await import("three/examples/jsm/controls/OrbitControls.js");
        const { GLTFLoader } =
          await import("three/examples/jsm/loaders/GLTFLoader.js");
        const { DRACOLoader } =
          await import("three/examples/jsm/loaders/DRACOLoader.js");
        const { RoomEnvironment } =
          await import("three/examples/jsm/environments/RoomEnvironment.js");
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
        const draftGroup = new THREE.Group();
        carGroup.add(draftGroup);
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
          draftGroup,
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
          } else if (stateRef.current.autoSpin) carGroup.rotation.y += 0.0036;
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

  /* ============ load/swap model when the BRAND model changes ============ */
  useEffect(() => {
    const t = three.current;
    if (!sceneReady || !t.initialized) return;

    // no vehicle selected -> clear the stage
    if (!currentModel) {
      if (t.modelRoot) {
        t.carGroup.remove(t.modelRoot);
        t.modelRoot = null;
      }
      t.carMeshes = [];
      while (t.decalGroup.children.length) {
        const c = t.decalGroup.children.pop();
        c.geometry?.dispose?.();
        c.material?.dispose?.();
      }
      if (t.handleGroup) disposeMarkGroup(t.handleGroup);
      setReady(false);
      return;
    }

    // same model already loaded (switching between two Mercedes vehicles) -> just refresh decals, no reload
    if (t.loadedModel === currentModel && t.modelRoot) {
      setReady(true);
      return;
    }

    setReady(false);
    setErrored(false);
    setSelectedMark(null);
    setLoadingMsg(`${activeBrand?.label || "Modell"} wird geladen`);

    const { THREE, carGroup, decalGroup, loader } = t;
    if (t.modelRoot) {
      carGroup.remove(t.modelRoot);
      t.modelRoot.traverse((o) => {
        if (o.isMesh) {
          o.geometry?.dispose?.();
          if (Array.isArray(o.material))
            o.material.forEach((m) => m.dispose?.());
          else o.material?.dispose?.();
        }
      });
      t.modelRoot = null;
    }
    t.carMeshes = [];
    while (decalGroup.children.length) {
      const c = decalGroup.children.pop();
      c.geometry?.dispose?.();
      c.material?.dispose?.();
    }
    if (t.handleGroup) disposeMarkGroup(t.handleGroup);
    carGroup.scale.setScalar(1);
    carGroup.position.set(0, 0, 0);
    carGroup.rotation.set(0, 0, 0);

    let cancelled = false;
    loader.load(
      currentModel,
      (gltf) => {
        if (cancelled) return;
        t.modelRoot = gltf.scene;
        t.loadedModel = currentModel;
        carGroup.add(gltf.scene);

        // --- robust framing -------------------------------------------------
        // Some downloaded models include junk (giant ground planes, backdrops,
        // light rigs) that inflate the bounding box and make the car look tiny.
        // We measure the MEDIAN-sized meshes to find the real car, ignore
        // outliers, scale to a consistent size, then fit the camera to it.

        const meshes = [];
        gltf.scene.updateWorldMatrix(true, true);
        gltf.scene.traverse((o) => {
          if (o.isMesh && o.geometry) {
            o.geometry.computeBoundingBox?.();
            meshes.push(o);
          }
        });

        // Separate the real car from TRUE backdrops only. A backdrop is a
        // mesh that is BOTH enormous AND nearly flat (ground plane / skybox /
        // wall). The old code dropped any mesh > median*4, which on some
        // models throws away the car body itself (it can be one big mesh) — so
        // the click-ray passed through it and hit a small interior part,
        // landing the mark in the wrong place. Now we keep every real part.
        const tmp = new THREE.Box3();
        const dims = meshes.map((m) => {
          tmp.setFromObject(m);
          const s = new THREE.Vector3();
          tmp.getSize(s);
          return {
            max: Math.max(s.x, s.y, s.z) || 0,
            min: Math.min(s.x, s.y, s.z) || 0,
          };
        });
        const sortedMax = dims
          .map((d) => d.max)
          .filter((v) => v > 0)
          .sort((a, b) => a - b);
        const median = sortedMax[Math.floor(sortedMax.length / 2)] || 1;
        // huge (>6x median) AND paper-thin (<2% of its own largest dim)
        const isBackdrop = (i) =>
          dims[i].max > median * 6 && dims[i].min < dims[i].max * 0.02;

        const carBox = new THREE.Box3();
        let any = false;
        meshes.forEach((m, i) => {
          if (!isBackdrop(i)) {
            tmp.setFromObject(m);
            carBox.union(tmp);
            any = true;
          }
        });
        // fallback: if filtering removed everything, use the whole scene
        if (!any) carBox.setFromObject(gltf.scene);

        const size = new THREE.Vector3();
        carBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        const TARGET = 3.6; // desired car length in scene units
        carGroup.scale.setScalar(TARGET / maxDim);

        // recenter on the (filtered) car and sit it on the floor
        const box2 = new THREE.Box3().setFromObject(carGroup);
        const c2 = new THREE.Vector3();
        box2.getCenter(c2);
        carGroup.position.x -= c2.x;
        carGroup.position.z -= c2.z;
        carGroup.position.y -= box2.min.y;

        // Collect ALL real car parts for raycasting (every non-backdrop mesh)
        // so the ray hits the actual body instead of passing through it.
        meshes.forEach((m, i) => {
          if (!isBackdrop(i)) {
            m.castShadow = true;
            m.receiveShadow = true;
            t.carMeshes.push(m);
          }
        });
        if (t.carMeshes.length === 0) {
          gltf.scene.traverse((o) => {
            if (o.isMesh) t.carMeshes.push(o);
          });
        }

        // --- fit camera to the car ------------------------------------------
        const fitBox = new THREE.Box3().setFromObject(carGroup);
        const center = new THREE.Vector3();
        fitBox.getCenter(center);
        const sphere = fitBox.getBoundingSphere(new THREE.Sphere());
        const r = sphere.radius || 2;
        const fov = (t.camera.fov * Math.PI) / 180;
        const fitDist = (r / Math.sin(fov / 2)) * 1.15; // padding

        // local-space radius (used to scale decals relative to the car)
        const scaleFactor = carGroup.scale.x || 1;
        t.localCarRadius = r / scaleFactor || 2;

        t.controls.target.copy(center);
        t.controls.minDistance = r * 0.6;
        t.controls.maxDistance = fitDist * 3;
        // place camera at a pleasant 3/4 angle at the fit distance
        const dirv = new THREE.Vector3(0.8, 0.45, 1).normalize();
        t.camera.position.copy(center).add(dirv.multiplyScalar(fitDist));
        t.camera.near = Math.max(0.01, r / 100);
        t.camera.far = fitDist * 10;
        t.camera.updateProjectionMatrix();
        t.controls.update();

        // remember the framing so "reset view" returns here
        t.homeView = {
          center: center.clone(),
          camPos: t.camera.position.clone(),
        };

        setReady(true);
        setAutoSpin(false);
      },
      (xhr) => {
        if (xhr.total)
          setLoadingMsg(
            `${activeBrand?.label || "Modell"} ${Math.round((xhr.loaded / xhr.total) * 100)}%`,
          );
      },
      (err) => {
        console.error(err);
        if (!cancelled) {
          setErrored(true);
          setLoadingMsg("Modell konnte nicht geladen werden.");
          toast.error("Modell konnte nicht geladen werden.");
        }
      },
    );
    return () => {
      cancelled = true;
    };
  }, [currentModel, sceneReady]);

  /* when switching vehicles that share a model, marks differ -> re-render decals */
  /* sync marks -> decals */
  useEffect(() => {
    const t = three.current;
    if (!t.decalGroup || !t.THREE || ready !== true) return;
    const { decalGroup } = t;
    disposeMarkGroup(decalGroup);
    marks.forEach((m, idx) =>
      addMarkVisual(t, decalGroup, m, idx + 1, m.id === selectedMark, false),
    );
    // size handles live in their own group, only for the selected mark
    if (t.handleGroup) {
      disposeMarkGroup(t.handleGroup);
      const sel = marks.find((m) => m.id === selectedMark);
      if (sel) addHandles(t, t.handleGroup, sel);
    }
  }, [marks, selectedMark, ready, activeVehicleId]);

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
    // distance scales with car size and damage size, in world units
    const R = (t.localCarRadius || 2) * (carGroup.scale.x || 1);
    const dist = R * (0.85 + (mark.size || 0.06) * 1.5);
    const camPos = world
      .clone()
      .add(dir.multiplyScalar(dist))
      .add(new THREE.Vector3(0, R * 0.25, 0));
    fly.fromCam.copy(camera.position);
    fly.toCam.copy(camPos);
    fly.fromTgt.copy(controls.target);
    fly.toTgt.copy(world);
    fly.t = 0;
    fly.active = true;
    setAutoSpin(false);
  }, []);

  // ── Pointer system ────────────────────────────────────────────────────
  // Clear, predictable rules (no hidden modes, no wheel-resize):
  //   TAP empty space            -> deselect (or, in Markier-Modus with
  //                                 nothing selected, drop a NEW mark there).
  //   TAP a mark                 -> select it. TAP it again -> deselect.
  //   DRAG a mark                -> move it across the bodywork.
  //   DRAG a handle (selected)   -> resize / re-angle it.
  //   DRAG empty space           -> orbit the camera.
  //   WHEEL                      -> always zoom (never touches size).
  // Placing a mark does NOT auto-select, so you can place several in a row and
  // the scene is never "stuck" with something selected.
  useEffect(() => {
    const t = three.current;
    if (ready !== true || !t.renderer || !t.THREE) return;
    const THREE = t.THREE;
    const el = t.renderer.domElement;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const R = () => t.localCarRadius || 2;
    const worldR = () => (t.localCarRadius || 2) * (t.carGroup.scale.x || 1);

    const setPointer = (e) => {
      const rect = el.getBoundingClientRect();
      t.pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      t.pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      t.raycaster.setFromCamera(t.pointer, t.camera);
    };

    const hitCar = () => {
      if (!t.carMeshes?.length) return null;
      const hits = t.raycaster.intersectObjects(t.carMeshes, true);
      if (!hits.length) return null;
      const hit = hits[0];
      t.carGroup.updateMatrixWorld(true);
      const localPt = t.carGroup.worldToLocal(hit.point.clone());
      let nrmLocal = new THREE.Vector3(0, 0, 1);
      let nrmWorld = new THREE.Vector3(0, 0, 1);
      if (hit.face) {
        nrmWorld = hit.face.normal
          .clone()
          .transformDirection(hit.object.matrixWorld)
          .normalize();
        const inv = new THREE.Matrix3()
          .getNormalMatrix(t.carGroup.matrixWorld)
          .invert();
        nrmLocal = nrmWorld.clone().applyMatrix3(inv).normalize();
      }
      return {
        worldPoint: hit.point.clone(),
        distance: hit.distance,
        nrmWorld,
        nrmLocal,
        localPt,
      };
    };

    // nearest mark under the pointer — ONLY the decal footprint counts, never
    // the floating pin/leader/halo (whose large hit areas used to re-select a
    // mark when you clicked near it).
    const hitMarkId = () => {
      const decals = t.decalGroup.children.filter((o) => o.userData.pick);
      if (!decals.length) return null;
      const mh = t.raycaster.intersectObjects(decals, false);
      return mh.length ? mh[0].object.userData.markId : null;
    };

    const hitHandle = () => {
      if (!t.handleGroup?.children.length) return null;
      const hits = t.raycaster.intersectObjects(t.handleGroup.children, false);
      const h = hits.find((x) => x.object.userData.handle);
      return h ? h.object.userData : null;
    };

    const markBasis = (m) => {
      const nrm = new THREE.Vector3(...(m.normal || [0, 0, 1])).normalize();
      const q = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        nrm,
      );
      return {
        nrm,
        center: new THREE.Vector3(...m.local),
        ex: new THREE.Vector3(1, 0, 0).applyQuaternion(q),
        ey: new THREE.Vector3(0, 1, 0).applyQuaternion(q),
        plane: new THREE.Plane().setFromNormalAndCoplanarPoint(
          nrm.clone().transformDirection(t.carGroup.matrixWorld).normalize(),
          t.carGroup.localToWorld(new THREE.Vector3(...m.local)),
        ),
      };
    };

    // g = current gesture: null | {kind:'resize',...} | {kind:'mark',...} | {kind:'orbit',...}
    let g = null;
    const TH = 5; // px movement threshold that turns a tap into a drag

    // Coalesce drag updates to one React commit per animation frame. Updating
    // state on every pointermove (each rebuilding the markers) was a big cause
    // of the stutter; this keeps dragging smooth.
    let rafId = 0;
    let pending = null;
    const flush = () => {
      rafId = 0;
      if (pending) {
        updateMarkRef.current(pending.id, pending.patch);
        pending = null;
      }
    };
    const schedule = (id, patch) => {
      pending = { id, patch };
      if (!rafId) rafId = requestAnimationFrame(flush);
    };

    const beginResize = (hk, e) => {
      const m = marksRef.current.find((x) => x.id === hk.markId);
      if (!m) return false;
      const basis = markBasis(m);
      let anchor = null;
      if (
        ELONGATED.has(m.type) &&
        (hk.handle === "endA" || hk.handle === "endB")
      ) {
        const cur = m.rotation || 0;
        const half = (m.length || 0.14) * R();
        const axis = basis.ex
          .clone()
          .multiplyScalar(Math.cos(cur))
          .add(basis.ey.clone().multiplyScalar(Math.sin(cur)));
        const sign = hk.handle === "endB" ? -1 : 1;
        anchor = basis.center
          .clone()
          .add(axis.clone().multiplyScalar(sign * half));
      }
      g = {
        kind: "resize",
        markId: hk.markId,
        handle: hk.handle,
        basis,
        anchor,
      };
      t.controls.enabled = false;
      setAutoSpin(false);
      el.setPointerCapture?.(e.pointerId);
      return true;
    };

    const applyResize = (ptLocal) => {
      const m = marksRef.current.find((x) => x.id === g.markId);
      if (!m) return;
      const b = g.basis;
      const rel = ptLocal.clone().sub(b.center);
      const u = rel.dot(b.ex);
      const v = rel.dot(b.ey);
      const r = R();
      if (!ELONGATED.has(m.type)) {
        schedule(m.id, { size: clamp(Math.hypot(u, v) / r, 0.025, 0.35) });
        return;
      }
      if (g.handle === "width") {
        const cur = m.rotation || 0;
        const perp = -u * Math.sin(cur) + v * Math.cos(cur);
        schedule(m.id, { size: clamp(Math.abs(perp) / (0.6 * r), 0.012, 0.1) });
        return;
      }
      const fixed = (g.anchor || b.center).clone();
      const seg = ptLocal.clone().sub(fixed);
      const segLen = seg.length();
      if (segLen < 1e-4) return;
      const newCenter = fixed.clone().add(seg.clone().multiplyScalar(0.5));
      const dir = seg.clone().normalize();
      const ang = Math.atan2(dir.dot(b.ey), dir.dot(b.ex));
      schedule(m.id, {
        local: [newCenter.x, newCenter.y, newCenter.z],
        length: clamp(segLen / 2 / r, 0.04, 0.6),
        rotation: ((ang % Math.PI) + Math.PI) % Math.PI,
      });
    };

    const onDown = (e) => {
      if (e.button !== 0) return;
      setPointer(e);

      // 1) a size handle on the selected mark
      const hk = hitHandle();
      if (hk && beginResize(hk, e)) {
        e.preventDefault();
        return;
      }

      // 2) a mark -> grab it (select + arm move). Disabling controls here (in
      //    the capture phase) makes OrbitControls bail, so a drag moves the
      //    mark instead of spinning the camera.
      const id = hitMarkId();
      if (id) {
        g = {
          kind: "mark",
          id,
          wasSelected: selectedMarkRef.current === id,
          moved: false,
          x: e.clientX,
          y: e.clientY,
        };
        t.controls.enabled = false;
        setAutoSpin(false);
        setSelectedMark(id);
        el.setPointerCapture?.(e.pointerId);
        return;
      }

      // 3) empty space -> let OrbitControls orbit; remember for tap detection
      g = { kind: "orbit", moved: false, x: e.clientX, y: e.clientY };
    };

    const onMove = (e) => {
      if (!g) return;
      if (g.kind === "resize") {
        setPointer(e);
        const hitPt = new THREE.Vector3();
        if (t.raycaster.ray.intersectPlane(g.basis.plane, hitPt))
          applyResize(t.carGroup.worldToLocal(hitPt.clone()));
        e.preventDefault();
        return;
      }
      const far = Math.abs(e.clientX - g.x) + Math.abs(e.clientY - g.y) > TH;
      if (g.kind === "mark") {
        if (far) g.moved = true;
        if (g.moved) {
          setPointer(e);
          const c = hitCar();
          if (c)
            schedule(g.id, {
              local: [c.localPt.x, c.localPt.y, c.localPt.z],
              normal: [c.nrmLocal.x, c.nrmLocal.y, c.nrmLocal.z],
            });
          e.preventDefault();
        }
        return;
      }
      if (g.kind === "orbit" && far) g.moved = true;
    };

    const finishDrag = (e) => {
      t.controls.enabled = true;
      try {
        el.releasePointerCapture?.(e.pointerId);
      } catch {}
    };

    const onUp = (e) => {
      if (!g) return;
      // commit the last drag value immediately
      if (rafId) {
        cancelAnimationFrame(rafId);
        rafId = 0;
      }
      flush();
      const cur = g;
      g = null;

      if (cur.kind === "resize") {
        finishDrag(e);
        return;
      }

      if (cur.kind === "mark") {
        finishDrag(e);
        if (!cur.moved) {
          // tap on a mark: toggle selection
          if (cur.wasSelected) setSelectedMark(null);
          else setSelectedMark(cur.id);
        }
        // if it moved, it stays selected (already set on down)
        return;
      }

      // orbit / empty space
      if (cur.moved) return; // was an orbit drag

      if (!stateRef.current.placing) {
        // view mode: a tap on empty space clears the selection
        if (selectedMarkRef.current) setSelectedMark(null);
        return;
      }

      // Markier-Modus: a tap on the car places a NEW mark — even right next to
      // an existing one (the previous selection is simply cleared). Tapping the
      // background (missing the car) deselects.
      if (!activeVehicleIdRef.current) {
        toast.error("Bitte zuerst ein Fahrzeug wählen oder anlegen.");
        return;
      }
      setPointer(e);
      const c = hitCar();
      if (!c) {
        if (selectedMarkRef.current) setSelectedMark(null);
        return;
      }
      const mk = makeMark(
        [c.localPt.x, c.localPt.y, c.localPt.z],
        [c.nrmLocal.x, c.nrmLocal.y, c.nrmLocal.z],
        stateRef.current.activeType,
      );
      setMarks((prev) => [...prev, mk]);
      setSelectedMark(null); // never leave the scene stuck on a selection
      toast.success("Schaden gesetzt — antippen zum Bearbeiten.", {
        id: "placed",
        duration: 1200,
      });
    };

    // capture phase so we run BEFORE OrbitControls and can suppress its orbit
    el.addEventListener("pointerdown", onDown, true);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      el.removeEventListener("pointerdown", onDown, true);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
      t.controls.enabled = true;
    };
  }, [ready]);

  // Esc clears the current selection (another easy way to reach "nothing
  // selected").
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") setSelectedMark(null);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const resetView = () => {
    const t = three.current;
    if (!t.camera) return;
    const { fly, camera, controls, homeView } = t;
    fly.fromCam.copy(camera.position);
    fly.fromTgt.copy(controls.target);
    if (homeView) {
      fly.toCam.copy(homeView.camPos);
      fly.toTgt.copy(homeView.center);
    } else {
      fly.toCam.set(5.4, 2.5, 6.4);
      fly.toTgt.set(0, 0.65, 0);
    }
    fly.t = 0;
    fly.active = true;
  };

  const updateMark = (id, patch) =>
    setMarks((prev) => prev.map((m) => (m.id === id ? { ...m, ...patch } : m)));
  const updateMarkRef = useRef(updateMark);
  updateMarkRef.current = updateMark;
  const deleteMark = (id) => {
    setMarks((prev) => prev.filter((m) => m.id !== id));
    if (selectedMark === id) setSelectedMark(null);
  };
  const clearAll = () => {
    if (
      marks.length &&
      confirm("Alle Markierungen dieses Fahrzeugs entfernen?")
    ) {
      setMarks([]);
      setSelectedMark(null);
    }
  };

  // ---- mechanical tasks, ordered-parts references and final bill ----
  const setMechanicalTasks = (updater) =>
    setMechanicalByVehicle((prev) => {
      if (!activeVehicleId) return prev;
      const cur = prev[activeVehicleId] || [];
      const next = typeof updater === "function" ? updater(cur) : updater;
      return { ...prev, [activeVehicleId]: next };
    });

  const addMechanicalTask = () => {
    if (!activeVehicleId)
      return toast.error("Bitte zuerst ein Fahrzeug wählen.");
    const job = mechanicalDraft.job.trim();
    if (!job) return toast.error("Bitte die mechanische Arbeit eintragen.");
    setMechanicalTasks((cur) => [
      ...cur,
      {
        id: `mech_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`,
        area: mechanicalDraft.area,
        job,
        note: mechanicalDraft.note.trim(),
        price: mechanicalDraft.price,
        done: false,
      },
    ]);
    setMechanicalDraft((draft) => ({ ...draft, job: "", note: "", price: "" }));
  };

  const updateMechanicalTask = (id, patch) =>
    setMechanicalTasks((cur) =>
      cur.map((task) => (task.id === id ? { ...task, ...patch } : task)),
    );

  const removeMechanicalTask = (id) =>
    setMechanicalTasks((cur) => cur.filter((task) => task.id !== id));

  const clearAllAufgaben = () => {
    if (
      !confirm(
        "Alle Karosserie- und Mechanikaufgaben dieses Fahrzeugs entfernen?",
      )
    )
      return;
    setMarks([]);
    setSelectedMark(null);
    setMechanicalTasks([]);
  };

  const selectMark = (id) => {
    setSelectedMark(id);
    const m = marks.find((x) => x.id === id);
    if (m) flyToMark(m);
  };

  /* ---- vehicle management ---- */
  const addVehicle = async ({ brandId, name, fin }) => {
    const selectedBrand = BRANDS.find((brand) => brand.id === brandId);
    const cleanName = String(name || "").trim();
    const cleanFin = String(fin || "")
      .trim()
      .toUpperCase();

    if (!selectedBrand) {
      toast.error("Bitte eine Fahrzeugmarke auswählen.");
      return;
    }

    if (!cleanName) {
      toast.error("Bitte die Fahrzeugbezeichnung eintragen.");
      return;
    }

    try {
      const response = await fetch("/api/workshop-inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: {
            brandId: selectedBrand.id,
            brandLabel: selectedBrand.label,
            name: cleanName,
            fin: cleanFin,
          },
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(
          data.message || "Fahrzeug konnte nicht angelegt werden.",
        );
      }

      const vehicle = applyInspectionToState(data.inspection);
      setActiveVehicleId(vehicle.id);
      setSelectedMark(null);
      setShowAdd(false);
      toast.success("Fahrzeug hinzugefügt");
    } catch (error) {
      console.error("Add vehicle error:", error);
      toast.error(error.message || "Fahrzeug konnte nicht angelegt werden.");
    }
  };

  const deleteVehicle = async (id) => {
    if (!confirm("Dieses Fahrzeug und alle Werkstattdaten entfernen?")) return;

    try {
      const response = await fetch(`/api/workshop-inspections/${id}`, {
        method: "DELETE",
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Löschen fehlgeschlagen.");
      }

      const remaining = vehicles.filter((vehicle) => vehicle.id !== id);
      setVehicles(remaining);
      setMarksByVehicle((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      setMechanicalByVehicle((current) => {
        const next = { ...current };
        delete next[id];
        return next;
      });
      if (activeVehicleId === id) {
        setActiveVehicleId(remaining[0]?.id || null);
        setSelectedMark(null);
      }
      toast.success("Fahrzeug gelöscht");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Löschen fehlgeschlagen.");
    }
  };

  const bodyworkTotal = useMemo(
    () => marks.reduce((sum, mark) => sum + parsePrice(mark.price), 0),
    [marks],
  );
  const mechanicalTotal = useMemo(
    () =>
      mechanicalTasks.reduce((sum, task) => sum + parsePrice(task.price), 0),
    [mechanicalTasks],
  );
  const workshopTotal = bodyworkTotal + mechanicalTotal;

  const handleSave = async () => {
    if (!activeVehicle) return;

    try {
      setSaving(true);
      const response = await fetch(
        `/api/workshop-inspections/${activeVehicle.id}`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            vehicle: {
              brandId: activeVehicle.brandId,
              brandLabel: activeBrand?.label || "",
              name: activeVehicle.name,
              fin: activeVehicle.fin || "",
            },
            bodywork: marks,
            mechanicalTasks,
            status: activeVehicle.status || "draft",
          }),
        },
      );
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.message || "Speichern fehlgeschlagen.");
      }

      applyInspectionToState(data.inspection);
      toast.success("Werkstattauftrag gespeichert");
    } catch (error) {
      console.error(error);
      toast.error(error.message || "Speichern fehlgeschlagen");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=960,height=1200");
    if (!w) return toast.error("Popup wurde blockiert.");
    const esc = (value = "") =>
      String(value ?? "").replace(
        /[&<>"']/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          })[char],
      );

    const bodyRows = marks
      .map((mark, index) => {
        const type = DAMAGE_TYPES.find((item) => item.id === mark.type);
        return `<tr><td>${index + 1}</td><td><span class="dot" style="background:${type?.color}"></span>${esc(type?.label)}</td><td>${esc(mark.panel) || "—"}</td><td><b>${esc(mark.action)}</b></td><td>${esc(mark.note) || "—"}</td><td class="money">${formatEuro(mark.price)}</td></tr>`;
      })
      .join("");

    const mechanicalRows = mechanicalTasks
      .map(
        (task, index) =>
          `<tr><td>${index + 1}</td><td>${esc(task.area)}</td><td><b>${esc(task.job)}</b></td><td>${esc(task.note) || "—"}</td><td>${task.done ? "Erledigt" : "Offen"}</td><td class="money">${formatEuro(task.price)}</td></tr>`,
      )
      .join("");

    const title = activeVehicle
      ? `${activeBrand?.label || ""} ${activeVehicle.name}`
      : "Fahrzeug";
    const bodyTotal = marks.reduce(
      (sum, mark) => sum + parsePrice(mark.price),
      0,
    );
    const mechanicalTotal = mechanicalTasks.reduce(
      (sum, task) => sum + parsePrice(task.price),
      0,
    );
    const grandTotal = bodyTotal + mechanicalTotal;

    w.document
      .write(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Werkstattauftrag</title><style>
      *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#0f172a;padding:40px}
      .top{display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:14px}
      .brand{font-size:18px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.doc{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.16em;text-align:right}
      h1{font-size:24px;margin:18px 0 2px}.sub{color:#64748b;font-size:13px;margin-bottom:20px}
      h2{font-size:13px;margin:24px 0 6px;letter-spacing:.08em;text-transform:uppercase;color:#475569}
      table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}
      th{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#64748b}.money{text-align:right;white-space:nowrap}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle}
      .bill{margin-top:28px;padding:18px;border:1px solid #cbd5e1;border-radius:12px;background:#f8fafc}.bill strong{display:block;font-size:26px;margin-top:4px}
      .foot{margin-top:30px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}
    </style></head><body onload="window.print();window.onafterprint=()=>window.close()">
      <div class="top"><div class="brand">Autogalerie Jülich</div><div class="doc">Karosserie- & Mechanikauftrag<br/>${new Date().toLocaleDateString("de-DE")}</div></div>
      <h1>${esc(title)}</h1><div class="sub">${activeVehicle?.fin ? `FIN ${esc(activeVehicle.fin)} · ` : ""}${marks.length} Karosserieposition(en) · ${mechanicalTasks.length} Mechanikaufgabe(n)</div>
      <h2>Karosserie / Lack</h2>
      <table><thead><tr><th>#</th><th>Schadensart</th><th>Bauteil</th><th>Maßnahme</th><th>Notiz</th><th class="money">Preis</th></tr></thead><tbody>${bodyRows || '<tr><td colspan="6">Keine Karosseriepositionen</td></tr>'}</tbody></table>
      <h2>Mechanik</h2>
      <table><thead><tr><th>#</th><th>Bereich</th><th>Arbeit</th><th>Notiz</th><th>Status</th><th class="money">Preis</th></tr></thead><tbody>${mechanicalRows || '<tr><td colspan="6">Keine Mechanikaufgaben</td></tr>'}</tbody></table>
      <div class="bill"><span style="font-size:11px;text-transform:uppercase;letter-spacing:.1em;color:#64748b">Kostenübersicht</span><div style="display:flex;justify-content:space-between;margin-top:10px;font-size:13px"><span>Karosserie / Lack</span><b>${formatEuro(bodyTotal)}</b></div><div style="display:flex;justify-content:space-between;margin-top:6px;font-size:13px"><span>Mechanik</span><b>${formatEuro(mechanicalTotal)}</b></div><strong style="display:flex;justify-content:space-between;border-top:1px solid #cbd5e1;padding-top:12px"><span>Gesamt</span><span>${formatEuro(grandTotal)}</span></strong></div>
      <div class="foot">Erstellt mit dem 3D-Werkstattwerkzeug · Nur für den internen Gebrauch.</div>
    </body></html>`);
    w.document.close();
    w.focus();
  };

  const handleBillingRangePrint = ({ from, to }) => {
    const start = from ? new Date(`${from}T00:00:00`) : null;
    const end = to ? new Date(`${to}T23:59:59`) : null;
    const selectedVehicles = vehicles.filter((vehicle) => {
      const date = new Date(vehicle.createdAt || vehicle.addedAt || Date.now());
      if (start && date < start) return false;
      if (end && date > end) return false;
      return true;
    });

    const rows = selectedVehicles.flatMap((vehicle) => {
      const brand = BRANDS.find((item) => item.id === vehicle.brandId);
      const body = marksByVehicle[vehicle.id] || [];
      const mechanical = mechanicalByVehicle[vehicle.id] || [];
      const bodyTotal = body.reduce(
        (sum, item) => sum + parsePrice(item.price),
        0,
      );
      const mechanicalTotal = mechanical.reduce(
        (sum, item) => sum + parsePrice(item.price),
        0,
      );
      const total = bodyTotal + mechanicalTotal;
      if (!body.length && !mechanical.length && total === 0) return [];
      return [
        {
          vehicle,
          brand: brand?.label || "",
          bodyCount: body.length,
          mechanicalCount: mechanical.length,
          bodyTotal,
          mechanicalTotal,
          total,
        },
      ];
    });

    if (!rows.length) {
      toast.error("Für diesen Zeitraum wurden keine Abrechnungen gefunden.");
      return;
    }

    const w = window.open("", "_blank", "width=1100,height=1200");
    if (!w) return toast.error("Popup wurde blockiert.");
    const esc = (value = "") =>
      String(value ?? "").replace(
        /[&<>"']/g,
        (char) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          })[char],
      );
    const grandBody = rows.reduce((sum, row) => sum + row.bodyTotal, 0);
    const grandMechanical = rows.reduce(
      (sum, row) => sum + row.mechanicalTotal,
      0,
    );
    const grandTotal = rows.reduce((sum, row) => sum + row.total, 0);
    const rangeLabel = `${from ? formatVehicleDate(from) : "Beginn"} – ${
      to ? formatVehicleDate(to) : "Heute"
    }`;

    w.document
      .write(`<!doctype html><html lang="de"><head><meta charset="utf-8"><title>Abrechnungsübersicht</title><style>
      *{box-sizing:border-box}body{font-family:Segoe UI,Arial,sans-serif;color:#18181b;padding:42px}header{display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #18181b;padding-bottom:16px}.brand{font-size:18px;font-weight:800;letter-spacing:.12em;text-transform:uppercase}.meta{text-align:right;font-size:11px;color:#71717a;text-transform:uppercase;letter-spacing:.1em}h1{font-size:26px;margin:24px 0 4px}.range{font-size:13px;color:#71717a;margin-bottom:24px}table{width:100%;border-collapse:collapse;font-size:12px}th{padding:10px;border-bottom:1px solid #d4d4d8;text-align:left;font-size:9px;text-transform:uppercase;letter-spacing:.1em;color:#71717a}td{padding:12px 10px;border-bottom:1px solid #e4e4e7;vertical-align:top}.num{text-align:right;white-space:nowrap}.vehicle{font-weight:700}.sub{font-size:10px;color:#a1a1aa;margin-top:3px}.summary{margin-top:26px;margin-left:auto;width:360px;border:1px solid #d4d4d8;border-radius:12px;padding:18px;background:#fafafa}.line{display:flex;justify-content:space-between;margin:7px 0;font-size:12px}.total{display:flex;justify-content:space-between;margin-top:14px;padding-top:14px;border-top:1px solid #d4d4d8;font-size:20px;font-weight:800}.foot{margin-top:34px;padding-top:12px;border-top:1px solid #e4e4e7;font-size:10px;color:#a1a1aa}
    </style></head><body onload="window.print();window.onafterprint=()=>window.close()"><header><div class="brand">Autogalerie Jülich</div><div class="meta">Abrechnungsübersicht<br>${new Date().toLocaleDateString("de-DE")}</div></header><h1>Werkstatt-Abrechnungen</h1><div class="range">Zeitraum: ${esc(rangeLabel)} · ${rows.length} Fahrzeug(e)</div><table><thead><tr><th>Fahrzeug</th><th>Datum</th><th>Karosserie</th><th>Mechanik</th><th class="num">Karosserie</th><th class="num">Mechanik</th><th class="num">Gesamt</th></tr></thead><tbody>${rows
      .map(
        (row) =>
          `<tr><td><div class="vehicle">${esc(`${row.brand} ${row.vehicle.name}`)}</div><div class="sub">${row.vehicle.fin ? `FIN ${esc(row.vehicle.fin)}` : "Keine FIN"}</div></td><td>${formatVehicleDate(row.vehicle.createdAt)}</td><td>${row.bodyCount} Pos.</td><td>${row.mechanicalCount} Pos.</td><td class="num">${formatEuro(row.bodyTotal)}</td><td class="num">${formatEuro(row.mechanicalTotal)}</td><td class="num"><b>${formatEuro(row.total)}</b></td></tr>`,
      )
      .join(
        "",
      )}</tbody></table><div class="summary"><div class="line"><span>Karosserie / Lack</span><b>${formatEuro(grandBody)}</b></div><div class="line"><span>Mechanik</span><b>${formatEuro(grandMechanical)}</b></div><div class="total"><span>Gesamt</span><span>${formatEuro(grandTotal)}</span></div></div><div class="foot">Zeitraumbezogene Abrechnungsübersicht · Autogalerie Jülich</div></body></html>`);
    w.document.close();
    w.focus();
    setShowBillingPrint(false);
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
    <div style={fontStack} className="min-h-screen bg-[#fafafa] text-zinc-900">
      <div
        className="pointer-events-none fixed inset-x-0 top-0 h-64"
        style={{
          background:
            "radial-gradient(80% 100% at 50% 0%, rgba(99,102,241,.08), transparent 70%)",
        }}
      />

      <div className="relative mx-auto w-full max-w-[1720px] px-4 sm:px-6 py-5">
        <header className="mb-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-zinc-900 text-white shadow-sm">
              <FiTarget size={18} />
            </div>
            <div>
              <h1 className="text-[15px] font-semibold leading-tight tracking-tight">
                Werkstatt-Inspektion{" "}
                <span className="font-normal text-zinc-400">3D</span>
              </h1>
              <p className="text-[11px] text-zinc-500">
                Karosserie markieren · Mechanik erfassen · Auftrag abrechnen
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowBillingPrint(true)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-medium text-zinc-700 shadow-sm transition hover:bg-zinc-50"
            >
              <FiFileText size={14} /> Abrechnungen
            </button>
            <button
              onClick={handleSave}
              disabled={!activeVehicle || saving}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700 disabled:opacity-40"
            >
              <FiSave size={14} /> {saving ? "Speichert…" : "Speichern"}
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

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[245px_minmax(0,1fr)_350px]">
          {/* TREE */}
          <VehicleTree
            brands={BRANDS}
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSelect={setActiveVehicleId}
            onAdd={() => setShowAdd(true)}
            onDeleteVehicle={deleteVehicle}
            marksByVehicle={marksByVehicle}
            mechanicalByVehicle={mechanicalByVehicle}
          />

          {/* CENTER: viewer + details strip */}
          <div className="flex flex-col gap-4">
            <section className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(24,24,27,.06),0_12px_40px_-12px_rgba(24,24,27,.12)]">
              <div
                ref={mountRef}
                className="relative aspect-[16/9] w-full touch-none"
                style={{
                  background: "linear-gradient(180deg,#ffffff 0%,#f4f4f5 100%)",
                  cursor: placing ? "crosshair" : "grab",
                }}
              >
                {dataLoading && (
                  <div className="absolute inset-0 z-20 grid place-items-center bg-white/80 backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
                      <span className="text-xs text-zinc-500">
                        Werkstattdaten werden geladen
                      </span>
                    </div>
                  </div>
                )}
                {!activeVehicle && !dataLoading && sceneReady && !errored && (
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
                        onClick={() => setShowAdd(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-700"
                      >
                        <FiPlusCircle size={14} /> Fahrzeug anlegen
                      </button>
                    </div>
                  </div>
                )}
                {activeVehicle && ready !== true && !errored && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-zinc-200 border-t-indigo-600" />
                      <span className="text-xs text-zinc-400">
                        {loadingMsg}
                      </span>
                    </div>
                  </div>
                )}
                {errored && (
                  <div className="absolute inset-0 grid place-items-center px-6">
                    <div className="flex max-w-xs flex-col items-center gap-2 text-center">
                      <FiAlertCircle className="text-red-500" size={22} />
                      <p className="text-xs text-zinc-500">
                        {loadingMsg}
                        <br />
                        Prüfe den Modellpfad der Marke und CORS.
                      </p>
                    </div>
                  </div>
                )}
                {ready === true && activeVehicle && (
                  <>
                    <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${placing ? "bg-indigo-600 text-white" : "border border-zinc-200 bg-white/90 text-zinc-600"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${placing ? "bg-white" : "bg-zinc-400"}`}
                        />
                        {placing ? "Markier-Modus" : "Nur Ansicht"}
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
                        onClick={() => setPlacing((p) => !p)}
                        active={placing}
                        title="Markier-Modus"
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
                    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center"></div>
                  </>
                )}
              </div>
            </section>

            {/* VEHICLE DETAILS AND TASKS */}
            {activeVehicle && (
              <section className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_3px_rgba(24,24,27,.05)]">
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
                    <DetailRow
                      label="Angelegt"
                      value={formatVehicleDate(activeVehicle.createdAt)}
                    />
                    <DetailRow
                      label="Karosseriepositionen"
                      value={`${marks.length}`}
                    />
                    <DetailRow
                      label="Mechanikaufgaben"
                      value={`${mechanicalTasks.length}`}
                    />
                  </div>
                </div>

                <div className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_3px_rgba(24,24,27,.05)]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FiClipboard className="text-zinc-400" size={14} />
                      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
                        Aufgaben · {marks.length + mechanicalTasks.length}
                      </h2>
                    </div>
                    {(marks.length > 0 || mechanicalTasks.length > 0) && (
                      <button
                        onClick={clearAllAufgaben}
                        className="text-[11px] font-medium text-red-600 hover:text-red-700"
                      >
                        Alle löschen
                      </button>
                    )}
                  </div>
                  {marks.length === 0 && mechanicalTasks.length === 0 ? (
                    <p className="py-2 text-[11px] text-zinc-400">
                      Noch keine Karosserie- oder Mechanikaufgaben.
                    </p>
                  ) : (
                    <ul className="-mx-1 max-h-72 space-y-1 overflow-auto px-1">
                      {marks.map((mark, index) => {
                        const type = DAMAGE_TYPES.find(
                          (item) => item.id === mark.type,
                        );
                        return (
                          <li
                            key={mark.id}
                            onClick={() => selectMark(mark.id)}
                            className={`group flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs transition ${selectedMark === mark.id ? "bg-indigo-50 ring-1 ring-indigo-200" : "hover:bg-zinc-50"}`}
                          >
                            <span
                              className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-full text-[10px] font-semibold text-white"
                              style={{ background: type?.color }}
                            >
                              {index + 1}
                            </span>
                            <span className="min-w-0 flex-1">
                              <span className="font-semibold text-zinc-700">
                                {mark.action}
                              </span>
                              <span className="mx-1.5 text-zinc-300">·</span>
                              <span className="text-zinc-500">
                                {mark.panel || type?.label}
                              </span>
                              {mark.note && (
                                <span className="block truncate text-[10.5px] text-zinc-400">
                                  {mark.note}
                                </span>
                              )}
                            </span>
                            <span className="rounded bg-indigo-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-indigo-700">
                              Karosserie
                            </span>
                          </li>
                        );
                      })}
                      {mechanicalTasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs hover:bg-zinc-50"
                        >
                          <button
                            onClick={() =>
                              updateMechanicalTask(task.id, {
                                done: !task.done,
                              })
                            }
                            className={`grid h-5 w-5 flex-shrink-0 place-items-center rounded-full border ${task.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 text-transparent"}`}
                          >
                            <FiCheckCircle size={12} />
                          </button>
                          <span className="min-w-0 flex-1">
                            <span
                              className={`font-semibold ${task.done ? "text-zinc-400 line-through" : "text-zinc-700"}`}
                            >
                              {task.job}
                            </span>
                            <span className="mx-1.5 text-zinc-300">·</span>
                            <span className="text-zinc-500">{task.area}</span>
                            {task.note && (
                              <span className="block truncate text-[10.5px] text-zinc-400">
                                {task.note}
                              </span>
                            )}
                          </span>
                          <span className="rounded bg-amber-50 px-1.5 py-0.5 text-[9px] font-bold uppercase text-amber-700">
                            Mechanik
                          </span>
                          <button
                            onClick={() => removeMechanicalTask(task.id)}
                            className="text-zinc-300 hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </section>
            )}

            {activeVehicle && (
              <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(24,24,27,.05)]">
                <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-200 px-5 py-4">
                  <div className="flex items-center gap-3">
                    <span className="grid h-9 w-9 place-items-center rounded-xl bg-zinc-900 text-white">
                      <FiDollarSign size={16} />
                    </span>
                    <div>
                      <h2 className="text-sm font-semibold text-zinc-900">
                        Abrechnung
                      </h2>
                      <p className="text-[10.5px] text-zinc-400">
                        Einzelpreise erfassen und Werkstattkosten automatisch
                        berechnen
                      </p>
                    </div>
                  </div>
                  <span className="rounded-full border border-zinc-200 bg-zinc-50 px-3 py-1 text-[10px] font-semibold text-zinc-500">
                    Rechnungsentwurf
                  </span>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-[1fr_260px]">
                  <div className="min-w-0 overflow-x-auto">
                    <table className="w-full min-w-[720px] border-collapse text-left">
                      <thead>
                        <tr className="border-b border-zinc-200 bg-zinc-50/80 text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-400">
                          <th className="w-14 px-4 py-3">Pos.</th>
                          <th className="w-28 px-3 py-3">Bereich</th>
                          <th className="px-3 py-3">Leistung</th>
                          <th className="px-3 py-3">Zuordnung</th>
                          <th className="w-36 px-4 py-3 text-right">Betrag</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-100">
                        {marks.map((mark, index) => {
                          const type = DAMAGE_TYPES.find(
                            (item) => item.id === mark.type,
                          );
                          return (
                            <tr
                              key={mark.id}
                              className="group hover:bg-zinc-50/60"
                            >
                              <td className="px-4 py-3 text-[11px] font-semibold tabular-nums text-zinc-400">
                                {String(index + 1).padStart(2, "0")}
                              </td>
                              <td className="px-3 py-3">
                                <span className="inline-flex items-center gap-1.5 rounded-md bg-indigo-50 px-2 py-1 text-[9.5px] font-semibold text-indigo-700">
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: type?.color }}
                                  />
                                  Karosserie
                                </span>
                              </td>
                              <td className="px-3 py-3">
                                <p className="text-[11px] font-semibold text-zinc-800">
                                  {mark.action ||
                                    type?.label ||
                                    "Arbeitsposition"}
                                </p>
                                {mark.note && (
                                  <p className="mt-0.5 max-w-[360px] truncate text-[9.5px] text-zinc-400">
                                    {mark.note}
                                  </p>
                                )}
                              </td>
                              <td className="px-3 py-3 text-[10.5px] text-zinc-500">
                                {mark.panel || type?.label || "—"}
                              </td>
                              <td className="px-4 py-2.5">
                                <MoneyInput
                                  value={mark.price || ""}
                                  onChange={(value) =>
                                    updateMark(mark.id, { price: value })
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}

                        {mechanicalTasks.map((task, index) => (
                          <tr
                            key={task.id}
                            className="group hover:bg-zinc-50/60"
                          >
                            <td className="px-4 py-3 text-[11px] font-semibold tabular-nums text-zinc-400">
                              {String(marks.length + index + 1).padStart(
                                2,
                                "0",
                              )}
                            </td>
                            <td className="px-3 py-3">
                              <span className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-1 text-[9.5px] font-semibold text-amber-700">
                                <FiTool size={10} /> Mechanik
                              </span>
                            </td>
                            <td className="px-3 py-3">
                              <p className="text-[11px] font-semibold text-zinc-800">
                                {task.job || "Mechanische Arbeit"}
                              </p>
                              {task.note && (
                                <p className="mt-0.5 max-w-[360px] truncate text-[9.5px] text-zinc-400">
                                  {task.note}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-3 text-[10.5px] text-zinc-500">
                              {task.area || "—"}
                            </td>
                            <td className="px-4 py-2.5">
                              <MoneyInput
                                value={task.price || ""}
                                onChange={(value) =>
                                  updateMechanicalTask(task.id, {
                                    price: value,
                                  })
                                }
                              />
                            </td>
                          </tr>
                        ))}

                        {marks.length === 0 && mechanicalTasks.length === 0 && (
                          <tr>
                            <td colSpan={5} className="px-5 py-10 text-center">
                              <FiDollarSign
                                className="mx-auto mb-2 text-zinc-300"
                                size={20}
                              />
                              <p className="text-[11px] font-medium text-zinc-500">
                                Noch keine abrechenbaren Positionen
                              </p>
                              <p className="mt-1 text-[10px] text-zinc-400">
                                Karosserie- und Mechanikaufgaben erscheinen
                                automatisch hier.
                              </p>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  <div className="border-t border-zinc-200 bg-zinc-50/70 p-5 xl:border-l xl:border-t-0">
                    <p className="text-[9px] font-semibold uppercase tracking-[.14em] text-zinc-400">
                      Kostenübersicht
                    </p>
                    <div className="mt-4 space-y-3">
                      <BillingSummaryRow
                        label={`Karosserie / Lack (${marks.length})`}
                        value={formatEuro(bodyworkTotal)}
                      />
                      <BillingSummaryRow
                        label={`Mechanik (${mechanicalTasks.length})`}
                        value={formatEuro(mechanicalTotal)}
                      />
                    </div>
                    <div className="my-4 border-t border-dashed border-zinc-300" />
                    <div className="flex items-end justify-between gap-3">
                      <div>
                        <p className="text-[9px] font-semibold uppercase tracking-[.12em] text-zinc-400">
                          Gesamtbetrag
                        </p>
                        <p className="mt-1 text-[9.5px] text-zinc-400">
                          Summe aller Positionen
                        </p>
                      </div>
                      <strong className="text-xl font-semibold tabular-nums tracking-tight text-zinc-900">
                        {formatEuro(workshopTotal)}
                      </strong>
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>

          {/* RIGHT: tools */}
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
                      className={`flex items-center justify-between rounded-lg border px-2.5 py-2 text-xs font-medium transition ${on ? "border-zinc-900 bg-zinc-900 text-white shadow-sm" : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 hover:bg-zinc-50"}`}
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
                          className={`rounded-full px-1.5 py-0.5 text-[10px] tabular-nums ${on ? "bg-white/20" : "bg-zinc-100 text-zinc-500"}`}
                        >
                          {n}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </Panel>

            {selected ? (
              <Panel
                title={`Position ${marks.findIndex((item) => item.id === selected.id) + 1} bearbeiten`}
                action={
                  <button
                    onClick={() => setSelectedMark(null)}
                    className="text-zinc-400 hover:text-zinc-600"
                  >
                    <FiX size={15} />
                  </button>
                }
              >
                <div className="space-y-3">
                  <Field label="Maßnahme">
                    <Select
                      value={selected.action}
                      onChange={(value) =>
                        updateMark(selected.id, { action: value })
                      }
                      options={BODYWORK_ACTIONS}
                    />
                  </Field>
                  <Field label="Bauteil">
                    <Select
                      value={selected.panel}
                      onChange={(value) =>
                        updateMark(selected.id, { panel: value })
                      }
                      options={["", ...PANELS]}
                      placeholder="Bauteil wählen (optional)"
                    />
                  </Field>
                  <Field label="Notiz">
                    <textarea
                      value={selected.note}
                      onChange={(event) =>
                        updateMark(selected.id, { note: event.target.value })
                      }
                      placeholder="z. B. tiefer Kratzer, Kante beachten …"
                      rows={3}
                      className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                    />
                  </Field>
                  <div className="flex items-center justify-between pt-1">
                    <button
                      onClick={() => flyToMark(selected)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-indigo-600"
                    >
                      <FiTarget size={13} /> Zur Stelle springen
                    </button>
                    <button
                      onClick={() => deleteMark(selected.id)}
                      className="inline-flex items-center gap-1.5 text-[11px] font-medium text-red-600"
                    >
                      <FiTrash2 size={13} /> Entfernen
                    </button>
                  </div>
                </div>
              </Panel>
            ) : (
              <Panel title="Karosserieposition bearbeiten">
                <div className="flex flex-col items-center gap-2 py-4 text-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full bg-zinc-100 text-zinc-400">
                    <FiCrosshair size={18} />
                  </div>
                  <p className="max-w-[230px] text-[11px] leading-relaxed text-zinc-400">
                    {activeVehicle
                      ? "Markiere einen Schaden am Fahrzeug oder wähle eine vorhandene Position. Größe und Ausrichtung steuerst du direkt am 3D-Fahrzeug."
                      : "Wähle zuerst ein Fahrzeug."}
                  </p>
                </div>
              </Panel>
            )}

            <Panel title="2 · Mechanische Arbeiten">
              <div className="space-y-3">
                <Field label="Bereich / Baugruppe">
                  <input
                    value={mechanicalDraft.area}
                    onChange={(event) =>
                      setMechanicalDraft((draft) => ({
                        ...draft,
                        area: event.target.value,
                      }))
                    }
                    placeholder="z. B. Vorderachse, Motor, Bremsanlage …"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </Field>
                <Field label="Arbeit frei eintragen">
                  <textarea
                    value={mechanicalDraft.job}
                    onChange={(event) =>
                      setMechanicalDraft((draft) => ({
                        ...draft,
                        job: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="Beliebige Arbeit eintragen, z. B. Bremsscheiben und Beläge vorne wechseln"
                    className="w-full resize-none rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </Field>
                <Field label="Notiz">
                  <textarea
                    value={mechanicalDraft.note}
                    onChange={(event) =>
                      setMechanicalDraft((draft) => ({
                        ...draft,
                        note: event.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="z. B. Geräusch vorne rechts, Diagnose durchführen …"
                    className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20"
                  />
                </Field>
                <button
                  onClick={addMechanicalTask}
                  disabled={!activeVehicle || !mechanicalDraft.job.trim()}
                  className="inline-flex h-9 w-full items-center justify-center gap-1.5 rounded-lg bg-amber-500 px-3 text-xs font-semibold text-white transition hover:bg-amber-600 disabled:opacity-40"
                >
                  <FiTool size={14} /> Mechanikaufgabe hinzufügen
                </button>
                {mechanicalTasks.length > 0 && (
                  <div className="border-t border-zinc-100 pt-3">
                    <p className="mb-2 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">
                      Aktive Mechanikaufgaben · {mechanicalTasks.length}
                    </p>
                    <div className="space-y-1.5">
                      {mechanicalTasks.map((task) => (
                        <div
                          key={task.id}
                          className="flex items-start gap-2 rounded-lg bg-zinc-50 px-2.5 py-2 text-[11px]"
                        >
                          <button
                            onClick={() =>
                              updateMechanicalTask(task.id, {
                                done: !task.done,
                              })
                            }
                            className={`mt-0.5 grid h-4 w-4 place-items-center rounded border ${task.done ? "border-emerald-600 bg-emerald-600 text-white" : "border-zinc-300 text-transparent"}`}
                          >
                            <FiCheckCircle size={10} />
                          </button>
                          <span className="min-w-0 flex-1">
                            <b
                              className={
                                task.done
                                  ? "text-zinc-400 line-through"
                                  : "text-zinc-700"
                              }
                            >
                              {task.job}
                            </b>
                            <span className="block text-zinc-400">
                              {task.area}
                              {task.note ? ` · ${task.note}` : ""}
                            </span>
                          </span>
                          <button
                            onClick={() => removeMechanicalTask(task.id)}
                            className="text-zinc-300 hover:text-red-500"
                          >
                            <FiX size={11} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </Panel>

            {/* AUFGABEN — merged list (per-mark positions + global actions) */}
          </aside>
        </div>
      </div>

      {showBillingPrint && (
        <BillingRangeModal
          onClose={() => setShowBillingPrint(false)}
          onPrint={handleBillingRangePrint}
        />
      )}

      {showAdd && (
        <AddVehicleModal
          brands={BRANDS}
          onClose={() => setShowAdd(false)}
          onAdd={addVehicle}
        />
      )}
    </div>
  );
}

/* =========================================================
   ADD VEHICLE MODAL
========================================================= */
function parsePrice(value) {
  const parsed = Number.parseFloat(String(value ?? "").replace(",", "."));
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatEuro(value) {
  return parsePrice(value).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}

function formatVehicleDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
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
          {brands.length === 0 && (
            <p className="text-[11px] text-red-500">
              Keine Marken definiert. Trage zuerst eine Marke in{" "}
              <code>BRANDS</code> ein.
            </p>
          )}
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

function BillingRangeModal({ onClose, onPrint }) {
  const now = new Date();
  const firstDay = new Date(now.getFullYear(), now.getMonth(), 1)
    .toISOString()
    .slice(0, 10);
  const today = now.toISOString().slice(0, 10);
  const [from, setFrom] = useState(firstDay);
  const [to, setTo] = useState(today);

  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-zinc-950/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-zinc-100 px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-zinc-900 text-white">
              <FiCalendar size={15} />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-zinc-900">
                Abrechnungen drucken
              </h3>
              <p className="text-[10px] text-zinc-400">
                Zeitraum für mehrere Fahrzeuge auswählen
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700"
          >
            <FiX size={16} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 px-5 py-5">
          <Field label="Von">
            <input
              type="date"
              value={from}
              onChange={(event) => setFrom(event.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
            />
          </Field>
          <Field label="Bis">
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(event) => setTo(event.target.value)}
              className="h-10 w-full rounded-lg border border-zinc-200 px-3 text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/15"
            />
          </Field>
          <div className="col-span-2 rounded-xl border border-indigo-100 bg-indigo-50/60 px-3 py-2.5 text-[10.5px] leading-relaxed text-indigo-700">
            Es wird eine gemeinsame Abrechnungsübersicht aller Fahrzeuge im
            gewählten Zeitraum gedruckt. Einzelne Werkstattaufträge bleiben über
            „Auftrag“ verfügbar.
          </div>
        </div>
        <div className="flex justify-end gap-2 border-t border-zinc-100 bg-zinc-50/60 px-5 py-3.5">
          <button
            onClick={onClose}
            className="h-9 rounded-lg border border-zinc-200 bg-white px-3 text-xs font-medium text-zinc-600 hover:bg-zinc-50"
          >
            Abbrechen
          </button>
          <button
            onClick={() => onPrint({ from, to })}
            disabled={!from || !to || from > to}
            className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-zinc-900 px-3.5 text-xs font-semibold text-white hover:bg-zinc-800 disabled:opacity-40"
          >
            <FiPrinter size={13} /> Übersicht drucken
          </button>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   VEHICLE TREE  (folder = brand, leaf = user vehicle)
========================================================= */
function VehicleTree({
  brands,
  vehicles,
  activeVehicleId,
  onSelect,
  onAdd,
  onDeleteVehicle,
  marksByVehicle,
  mechanicalByVehicle,
}) {
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [openBrands, setOpenBrands] = useState({});

  const filteredBrands = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return brands.map((brand) => {
      const brandVehicles = vehicles.filter((vehicle) => {
        if (vehicle.brandId !== brand.id) return false;
        const created = new Date(
          vehicle.createdAt || vehicle.addedAt || Date.now(),
        );
        const now = new Date();
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const startOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1,
        );
        const endOfLastMonth = new Date(
          now.getFullYear(),
          now.getMonth(),
          0,
          23,
          59,
          59,
        );
        const startOfYear = new Date(now.getFullYear(), 0, 1);
        if (timeFilter === "month" && created < startOfMonth) return false;
        if (
          timeFilter === "lastMonth" &&
          (created < startOfLastMonth || created > endOfLastMonth)
        )
          return false;
        if (timeFilter === "year" && created < startOfYear) return false;
        if (!needle) return true;
        return `${vehicle.name} ${vehicle.fin || ""} ${brand.label}`
          .toLowerCase()
          .includes(needle);
      });
      return { ...brand, vehicles: brandVehicles };
    });
  }, [brands, vehicles, query, timeFilter]);

  return (
    <aside className="flex min-h-[620px] flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-[0_1px_3px_rgba(24,24,27,.05)]">
      <div className="flex items-center justify-between border-b border-zinc-100 px-3 py-3">
        <h2 className="text-[10px] font-semibold uppercase tracking-[.12em] text-zinc-400">
          Fahrzeuge
        </h2>
        <button
          onClick={onAdd}
          className="inline-flex h-7 items-center gap-1 rounded-md bg-indigo-600 px-2.5 text-[10px] font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          <FiPlus size={12} /> Neu
        </button>
      </div>

      <div className="px-2.5 py-3">
        <div className="relative">
          <FiSearch
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
            size={13}
          />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Suchen..."
            className="h-8 w-full rounded-lg border border-zinc-200 bg-white pl-8 pr-3 text-[10.5px] outline-none transition placeholder:text-zinc-400 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
          />
        </div>
      </div>

      <div className="px-2.5 pb-2">
        <div className="grid grid-cols-4 rounded-lg border border-zinc-200 bg-zinc-50 p-0.5">
          {[
            ["all", "Alle"],
            ["month", "Monat"],
            ["lastMonth", "Letzter"],
            ["year", "Jahr"],
          ].map(([value, label]) => (
            <button
              key={value}
              onClick={() => setTimeFilter(value)}
              className={`rounded-md px-1 py-1.5 text-[9px] font-medium transition ${
                timeFilter === value
                  ? "bg-white text-zinc-900 shadow-sm ring-1 ring-zinc-200"
                  : "text-zinc-400 hover:text-zinc-600"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 overflow-auto px-2 pb-3">
        <ul className="space-y-0.5">
          {filteredBrands.map((brand) => {
            const open =
              !!openBrands[brand.id] || (query && brand.vehicles.length > 0);
            const total = brand.vehicles.length;
            return (
              <li key={brand.id}>
                <button
                  onClick={() =>
                    setOpenBrands((prev) => ({
                      ...prev,
                      [brand.id]: !prev[brand.id],
                    }))
                  }
                  className="group flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition hover:bg-zinc-50"
                >
                  <span className="text-zinc-400">
                    {open ? (
                      <FiChevronDown size={12} />
                    ) : (
                      <FiChevronRight size={12} />
                    )}
                  </span>
                  <FiFolder size={15} className="flex-none text-zinc-400" />
                  <span className="min-w-0 flex-1 truncate text-[11px] font-medium text-zinc-700">
                    {brand.label}
                  </span>
                  <span className="min-w-5 rounded-full bg-zinc-100 px-1.5 py-0.5 text-center text-[9px] font-medium tabular-nums text-zinc-500">
                    {total}
                  </span>
                </button>

                {open && (
                  <div className="ml-[19px] border-l border-zinc-200 pl-2">
                    {brand.vehicles.length === 0 ? (
                      <p className="px-2 py-2 text-[9.5px] text-zinc-400">
                        Keine Fahrzeuge
                      </p>
                    ) : (
                      <ul className="space-y-0.5 py-0.5">
                        {brand.vehicles.map((vehicle) => {
                          const active = vehicle.id === activeVehicleId;
                          const bodyCount =
                            marksByVehicle[vehicle.id]?.length || 0;
                          const mechCount =
                            mechanicalByVehicle[vehicle.id]?.length || 0;
                          return (
                            <li key={vehicle.id} className="group/vehicle">
                              <div
                                className={`flex items-center rounded-lg transition ${
                                  active
                                    ? "bg-indigo-50 text-indigo-800"
                                    : "text-zinc-600 hover:bg-zinc-50"
                                }`}
                              >
                                <button
                                  onClick={() => onSelect(vehicle.id)}
                                  className="min-w-0 flex-1 px-2 py-2 text-left"
                                >
                                  <span className="block truncate text-[10.5px] font-medium">
                                    {vehicle.name}
                                  </span>
                                  <span className="mt-0.5 flex items-center gap-1.5 text-[8.5px] text-zinc-400">
                                    {vehicle.fin ? (
                                      <span className="truncate font-mono">
                                        {vehicle.fin}
                                      </span>
                                    ) : (
                                      <span>Keine FIN</span>
                                    )}
                                    {(bodyCount > 0 || mechCount > 0) && (
                                      <span className="flex-none">
                                        · {bodyCount + mechCount} Aufgabe(n)
                                      </span>
                                    )}
                                  </span>
                                </button>
                                <button
                                  onClick={() => onDeleteVehicle(vehicle.id)}
                                  className="mr-1 rounded p-1 text-zinc-300 opacity-0 transition hover:bg-red-50 hover:text-red-500 group-hover/vehicle:opacity-100"
                                  title="Fahrzeug entfernen"
                                >
                                  <FiTrash2 size={11} />
                                </button>
                              </div>
                            </li>
                          );
                        })}
                      </ul>
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </div>
    </aside>
  );
}

function MoneyInput({ value, onChange }) {
  return (
    <div className="relative ml-auto w-28">
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="0,00"
        className="h-8 w-full rounded-md border border-zinc-200 bg-white pl-2.5 pr-7 text-right text-[11px] font-semibold tabular-nums text-zinc-800 outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/10"
      />
      <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[9.5px] text-zinc-400">
        €
      </span>
    </div>
  );
}

function BillingSummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3 text-[10.5px]">
      <span className="text-zinc-500">{label}</span>
      <strong className="font-semibold tabular-nums text-zinc-800">
        {value}
      </strong>
    </div>
  );
}

/* damage textures */
function buildDamageTextures(THREE) {
  // Realistic, semi-transparent damage drawn on a transparent canvas so the
  // car's paint shows through (reads as damage ON the panel, not a sticker).
  // Type is colour-coded by the numbered pin, so these focus on realism.
  const S = 512;
  const tex = (draw) => {
    const c = document.createElement("canvas");
    c.width = c.height = S;
    const ctx = c.getContext("2d");
    ctx.clearRect(0, 0, S, S);
    draw(ctx);
    const t = new THREE.CanvasTexture(c);
    t.anisotropy = 8;
    t.needsUpdate = true;
    return t;
  };
  const M = S / 2;
  // soft circular alpha falloff so every decal feathers into the paint
  const vignette = (ctx, rad, inner) => {
    const g = ctx.createRadialGradient(M, M, rad * inner, M, M, rad);
    g.addColorStop(0, "rgba(0,0,0,0)");
    g.addColorStop(1, "rgba(0,0,0,0)");
    return g;
  };

  // long axis = canvas X (matches decal width = length for elongated types)
  const scratch = tex((ctx) => {
    const lines = 5;
    for (let i = 0; i < lines; i++) {
      const yy = M + (i - (lines - 1) / 2) * 14 + (Math.random() * 8 - 4);
      const len = 0.6 + Math.random() * 0.34; // fraction of width
      const x0 = M - (len * S) / 2;
      const x1 = M + (len * S) / 2;
      const wob = Math.random() * 14 - 7;
      // dark groove
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(35,32,38,${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 2 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, yy);
      ctx.bezierCurveTo(M - 60, yy + wob, M + 60, yy - wob, x1, yy);
      ctx.stroke();
      // bright metal highlight just above the groove
      ctx.strokeStyle = `rgba(255,255,255,${0.45 + Math.random() * 0.3})`;
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(x0, yy - 1.4);
      ctx.bezierCurveTo(
        M - 60,
        yy + wob - 1.4,
        M + 60,
        yy - wob - 1.4,
        x1,
        yy - 1.4,
      );
      ctx.stroke();
    }
    // fade the ends
    const grad = ctx.createLinearGradient(0, 0, S, 0);
    grad.addColorStop(0, "rgba(255,255,255,1)");
    grad.addColorStop(0.12, "rgba(255,255,255,0)");
    grad.addColorStop(0.88, "rgba(255,255,255,0)");
    grad.addColorStop(1, "rgba(255,255,255,1)");
    ctx.globalCompositeOperation = "destination-out";
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, S, S);
    ctx.globalCompositeOperation = "source-over";
  });

  const dent = tex((ctx) => {
    // concave illusion: dark pool + shadow lower-right, highlight upper-left
    const shadow = ctx.createRadialGradient(M + 26, M + 30, 8, M, M, M * 0.92);
    shadow.addColorStop(0, "rgba(14,14,20,0.52)");
    shadow.addColorStop(0.55, "rgba(28,28,36,0.24)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(M, M, M * 0.92, M * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
    // specular highlight crescent (upper-left rim)
    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    const hi = ctx.createRadialGradient(
      M - 40,
      M - 46,
      4,
      M - 30,
      M - 34,
      M * 0.7,
    );
    hi.addColorStop(0, "rgba(255,255,255,0.55)");
    hi.addColorStop(0.4, "rgba(255,255,255,0.12)");
    hi.addColorStop(1, "rgba(255,255,255,0)");
    ctx.fillStyle = hi;
    ctx.beginPath();
    ctx.ellipse(M - 24, M - 26, M * 0.6, M * 0.5, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
    // crisp deepest point
    const core = ctx.createRadialGradient(
      M + 14,
      M + 16,
      1,
      M + 14,
      M + 16,
      26,
    );
    core.addColorStop(0, "rgba(8,8,12,0.55)");
    core.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(M + 14, M + 16, 26, 0, Math.PI * 2);
    ctx.fill();
  });

  const paint = tex((ctx) => {
    // chipped paint: irregular patch with exposed lighter primer + dark rim
    const pts = 16;
    const radii = [];
    ctx.beginPath();
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = M * (0.46 + Math.random() * 0.34);
      radii.push(r);
      const x = M + Math.cos(a) * r;
      const y = M + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    // dark chipped edge
    ctx.fillStyle = "rgba(46,34,36,0.42)";
    ctx.fill();
    // primer/metal showing in the middle
    ctx.save();
    ctx.clip();
    const pg = ctx.createRadialGradient(M, M, 4, M, M, M * 0.7);
    pg.addColorStop(0, "rgba(214,212,216,0.62)");
    pg.addColorStop(0.7, "rgba(190,186,190,0.32)");
    pg.addColorStop(1, "rgba(150,120,120,0.05)");
    ctx.fillStyle = pg;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();
    // flaking chips around the edge
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = M * (0.45 + Math.random() * 0.4);
      ctx.fillStyle = `rgba(40,30,32,${0.25 + Math.random() * 0.4})`;
      ctx.beginPath();
      ctx.arc(
        M + Math.cos(a) * r,
        M + Math.sin(a) * r,
        2 + Math.random() * 5,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
  });

  const rust = tex((ctx) => {
    // organic orange-brown stain with grain and pitting
    const g = ctx.createRadialGradient(M, M, 4, M, M, M * 0.96);
    g.addColorStop(0, "rgba(120,55,18,0.72)");
    g.addColorStop(0.45, "rgba(150,82,28,0.5)");
    g.addColorStop(0.8, "rgba(168,98,40,0.22)");
    g.addColorStop(1, "rgba(168,98,40,0)");
    ctx.fillStyle = g;
    // irregular blob outline
    ctx.beginPath();
    const pts = 18;
    for (let i = 0; i <= pts; i++) {
      const a = (i / pts) * Math.PI * 2;
      const r = M * (0.6 + Math.sin(i * 1.7) * 0.12 + Math.random() * 0.22);
      const x = M + Math.cos(a) * r;
      const y = M + Math.sin(a) * r;
      i === 0 ? ctx.moveTo(x, y) : ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fill();
    // grain
    for (let i = 0; i < 1400; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = Math.random() * M * 0.82;
      const x = M + Math.cos(a) * r;
      const y = M + Math.sin(a) * r;
      const shade = Math.random();
      ctx.fillStyle =
        shade < 0.5
          ? `rgba(${90 + Math.random() * 60},${40 + Math.random() * 35},12,${Math.random() * 0.5})`
          : `rgba(${40 + Math.random() * 30},20,8,${Math.random() * 0.45})`;
      ctx.fillRect(x, y, 2, 2);
    }
  });

  const crack = tex((ctx) => {
    // sharp jagged branching crack with a faint highlight for depth
    const branch = (x, y, ang, len, depth) => {
      if (depth <= 0 || len < 4) return;
      const nx = x + Math.cos(ang) * len;
      const ny = y + Math.sin(ang) * len;
      ctx.strokeStyle = `rgba(20,16,24,${0.55 + depth * 0.08})`;
      ctx.lineWidth = depth * 1.1;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(nx, ny);
      ctx.stroke();
      ctx.strokeStyle = "rgba(255,255,255,0.18)";
      ctx.lineWidth = Math.max(0.6, depth * 0.4);
      ctx.beginPath();
      ctx.moveTo(x + 1, y - 1);
      ctx.lineTo(nx + 1, ny - 1);
      ctx.stroke();
      branch(nx, ny, ang + (Math.random() - 0.5) * 0.9, len * 0.72, depth - 1);
      if (Math.random() > 0.45)
        branch(nx, ny, ang + (Math.random() - 0.5) * 1.8, len * 0.6, depth - 1);
    };
    const a0 = (Math.random() - 0.5) * 0.7; // bias along the long (X) axis
    branch(M, M, a0, S * 0.2, 5);
    branch(M, M, a0 + Math.PI + (Math.random() - 0.5) * 0.5, S * 0.2, 5);
  });

  const other = tex((ctx) => {
    // subtle neutral marker — faint disc, thin ring, centre dot
    const g = ctx.createRadialGradient(M, M, 2, M, M, M * 0.7);
    g.addColorStop(0, "rgba(82,82,91,0.22)");
    g.addColorStop(1, "rgba(82,82,91,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(M, M, M * 0.7, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(82,82,91,0.55)";
    ctx.lineWidth = 3;
    ctx.setLineDash([10, 8]);
    ctx.beginPath();
    ctx.arc(M, M, M * 0.55, 0, Math.PI * 2);
    ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = "rgba(82,82,91,0.8)";
    ctx.beginPath();
    ctx.arc(M, M, 7, 0, Math.PI * 2);
    ctx.fill();
  });

  return { scratch, dent, paint, rust, crack, other };
}
function pinTexture(THREE, n, color, selected) {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const cx = S / 2,
    cy = S / 2;
  const r = selected ? S * 0.4 : S * 0.36;
  // soft drop shadow + accent halo when selected
  ctx.save();
  ctx.shadowColor = "rgba(24,24,27,0.35)";
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 3;
  if (selected) {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(cx, cy, r + 6, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  // white outer ring
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  // colored badge
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 7, 0, Math.PI * 2);
  ctx.fill();
  // number
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${selected ? 46 : 42}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n), cx, cy + 1);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.userData = { ephemeral: true };
  return t;
}
function softHaloTexture(THREE) {
  // soft radial glow used as a subtle selection cue (no hard edges)
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(79,70,229,0.55)");
  g.addColorStop(0.5, "rgba(79,70,229,0.18)");
  g.addColorStop(1, "rgba(79,70,229,0)");
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, S, S);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.userData = { ephemeral: true };
  return t;
}
function dotTexture(THREE, color) {
  const S = 64;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const cx = S / 2,
    cy = S / 2;
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.34, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, S * 0.22, 0, Math.PI * 2);
  ctx.fill();
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.userData = { ephemeral: true };
  return t;
}
function circleRingTexture_REMOVED() {}

/* Grabbable size-handle knob: white disc, indigo ring, soft shadow. `accent`
   makes the core indigo (radius/width handles) vs hollow (endpoints). */
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
  ctx.strokeStyle = "#4f46e5";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  if (accent) {
    ctx.fillStyle = "#4f46e5";
    ctx.beginPath();
    ctx.arc(cx, cy, r * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.userData = { ephemeral: true };
  return t;
}

/* Dispose every child of a group, but only dispose EPHEMERAL textures —
   shared damage textures and CACHED ui textures are reused and must survive. */
function disposeMarkGroup(group) {
  while (group.children.length) {
    const c = group.children.pop();
    c.geometry?.dispose?.();
    const mats = Array.isArray(c.material) ? c.material : [c.material];
    mats.forEach((mm) => {
      if (!mm) return;
      if (mm.map && mm.map.userData && mm.map.userData.ephemeral)
        mm.map.dispose?.();
      mm.dispose?.();
    });
  }
}

/* Cache canvas textures on the shared `t` object so dragging (which rebuilds
   the marker meshes every frame) never regenerates a canvas — the old code
   redrew every pin/dot/halo each pointermove, which was the main source of
   stutter. Cached textures are NOT ephemeral, so they survive disposal. */
function cachedTex(t, key, make) {
  if (!t._tex) t._tex = {};
  if (t._tex[key]) return t._tex[key];
  const tex = make();
  tex.userData = { cached: true };
  t._tex[key] = tex;
  return tex;
}

/* Build all three.js objects for ONE mark spec and add them to `group`.
   Used for BOTH committed marks and the live draw preview, so a damage looks
   identical the moment you start drawing it. Only the decal grows with size;
   the anchor dot and numbered pin stay a constant size. `number` may be null
   (draft) to skip the pin. */
function addMarkVisual(t, group, spec, number, isSel, draft) {
  const { THREE, textures } = t;
  const type = DAMAGE_TYPES.find((x) => x.id === spec.type);
  const color = type?.color || "#111";
  const pos = new THREE.Vector3(...spec.local);
  const nrm = new THREE.Vector3(...(spec.normal || [0, 0, 1])).normalize();
  const quat = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    nrm,
  );
  const cl = (v, a, b) => Math.min(b, Math.max(a, v));
  const R = t.localCarRadius || 2;
  const isElong = ELONGATED.has(spec.type);
  const sizeFrac = cl(spec.size, 0.02, 0.35);
  const lenFrac = cl(spec.length || sizeFrac, 0.04, 0.6);
  const width = isElong ? lenFrac * R : sizeFrac * R;
  const height = isElong ? sizeFrac * 0.6 * R : sizeFrac * R;
  const offset = R * 0.006;
  const surfacePos = pos.clone().add(nrm.clone().multiplyScalar(offset));
  const markId = spec.id;

  // (a) damage decal. depthTest:false so it ALWAYS shows on the bodywork — a
  // flat plane on a curved panel would otherwise sink below the surface and
  // vanish. renderOrder keeps it above the car but below dot/pin.
  const decal = new THREE.Mesh(
    new THREE.PlaneGeometry(width * 2, height * 2),
    new THREE.MeshBasicMaterial({
      map: textures[spec.type] || textures.other,
      transparent: true,
      depthWrite: false,
      depthTest: false,
      opacity: draft ? 0.9 : 1.0,
    }),
  );
  decal.position.copy(surfacePos);
  decal.quaternion.copy(quat);
  decal.rotateZ(spec.rotation || 0);
  decal.userData.markId = markId;
  decal.userData.pick = true; // ONLY the decal footprint is selectable
  decal.renderOrder = 10;
  group.add(decal);

  // (b) selection cue: a very soft, low-opacity halo ONLY when selected — no
  // hard ring around the damage. Extent and resize are shown by the handles.
  if (isSel && !draft) {
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 2 * 1.7, height * 2 * 1.7),
      new THREE.MeshBasicMaterial({
        map: cachedTex(t, "halo", () => softHaloTexture(THREE)),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        opacity: 0.5,
      }),
    );
    halo.position
      .copy(pos)
      .add(nrm.clone().multiplyScalar(offset + R * 0.0005));
    halo.quaternion.copy(quat);
    halo.rotateZ(spec.rotation || 0);
    halo.renderOrder = 8;
    group.add(halo);
  }

  // (c) constant-size anchor dot at the exact damage point
  const dot = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: cachedTex(t, "dot_" + color, () => dotTexture(THREE, color)),
      depthTest: false,
      transparent: true,
    }),
  );
  const dotSize = R * 0.02;
  dot.scale.set(dotSize, dotSize, 1);
  dot.position.copy(surfacePos);
  dot.renderOrder = 18;
  group.add(dot);

  if (number == null) return; // draft: no pin / leader

  // (d+e) numbered pin floating above on a thin leader — CONSTANT size
  const pinSize = R * (isSel ? 0.115 : 0.088);
  const lift = R * 0.12 + (isSel ? R * 0.02 : 0);
  const pinPos = surfacePos
    .clone()
    .add(new THREE.Vector3(0, Math.max(height, width) + lift, 0));
  const leader = new THREE.Line(
    new THREE.BufferGeometry().setFromPoints([
      surfacePos.clone(),
      pinPos.clone(),
    ]),
    new THREE.LineBasicMaterial({
      color: new THREE.Color(color),
      transparent: true,
      opacity: 0.55,
      depthTest: false,
    }),
  );
  leader.renderOrder = 20;
  group.add(leader);

  const pin = new THREE.Sprite(
    new THREE.SpriteMaterial({
      map: cachedTex(
        t,
        "pin_" + number + "_" + color + "_" + (isSel ? 1 : 0),
        () => pinTexture(THREE, number, color, isSel),
      ),
      depthTest: false,
      transparent: true,
    }),
  );
  pin.center.set(0.5, 0);
  pin.scale.set(pinSize, pinSize, 1);
  pin.position.copy(pinPos);
  pin.renderOrder = 22;
  group.add(pin);
}

/* Draggable size handles for the SELECTED mark, placed on the bodywork.
   Round damage -> one rim handle (radius). Scratch/crack -> two end handles
   (length + angle) and one side handle (width). These replace the sidebar
   sliders with direct, on-car manipulation. */
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
  const knobSize = R * 0.055;

  const addKnob = (localPos, handle, accent) => {
    const sp = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: cachedTex(t, "knob_" + (accent ? 1 : 0), () =>
          handleKnobTexture(THREE, accent),
        ),
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

  // faint guide line(s) so the user reads the handles as a control rig
  const addGuide = (a, b) => {
    const ln = new THREE.Line(
      new THREE.BufferGeometry().setFromPoints([
        a.clone().add(lift),
        b.clone().add(lift),
      ]),
      new THREE.LineBasicMaterial({
        color: new THREE.Color("#4f46e5"),
        transparent: true,
        opacity: 0.5,
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

/* UI primitives */
function Panel({ title, action, children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-zinc-200 bg-white p-4 shadow-[0_1px_3px_rgba(24,24,27,.05)] ${className}`}
    >
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

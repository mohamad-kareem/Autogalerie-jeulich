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
  FiMinus,
  FiPlus,
  FiFolder,
  FiFolderPlus,
  FiTruck,
  FiSearch,
  FiPlusCircle,
  FiClipboard,
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
    id: "Peugeot",
    label: "Peugeot",
    model: "/peugeot.glb",
  },
  {
    id: "Ford",
    label: "Ford",
    model: "/fordfocus.glb",
  },
  {
    id: "Hyundai",
    label: "Hyundai",
    model: "/hyundai.glb",
  },
  {
    id: "Opel",
    label: "Opel",
    model: "/opel.glb",
  },
  {
    id: "Kia    ",
    label: "Kia",
    model: "/kiapicanto.glb",
  },
  {
    id: "Kia1    ",
    label: "Kia1",
    model: "/kiapicanto1.glb",
  },
];

/* Seed vehicles (optional). Users add more in-app. */
const SEED_VEHICLES = [
  // { id: "v1", brandId: "mercedes", name: "GLK 220 CDI", fin: "WDC2049811A123456" },
];

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

// damage types that look like strokes (long & thin) get a length dimension
const ELONGATED = new Set(["scratch", "crack"]);

// vehicle-wide actions that don't need a point on the car
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
  size: 0.06, // 6% of car radius
  length: ELONGATED.has(type) ? 0.14 : 0.06, // 14% for elongated default
  rotation: 0,
});

export default function VehicleInspection3DPage() {
  // vehicles (user-managed) + selection
  const [vehicles, setVehicles] = useState(SEED_VEHICLES);
  const [activeVehicleId, setActiveVehicleId] = useState(
    SEED_VEHICLES[0]?.id || null,
  );
  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || null;
  const activeBrand = activeVehicle
    ? BRANDS.find((b) => b.id === activeVehicle.brandId)
    : null;

  // per-vehicle marks
  const [marksByVehicle, setMarksByVehicle] = useState({});
  // vehicle-wide actions: { [vehicleId]: { actions: Set, custom: [string] } }
  const [globalsByVehicle, setGlobalsByVehicle] = useState({});
  const marks = (activeVehicleId && marksByVehicle[activeVehicleId]) || [];
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
  const [autoSpin, setAutoSpin] = useState(true);
  const [showAdd, setShowAdd] = useState(false);

  const mountRef = useRef(null);
  const three = useRef({});
  const stateRef = useRef({});
  stateRef.current = { autoSpin, placing, activeType };
  const marksRef = useRef([]);
  marksRef.current = marks;

  const currentModel = activeBrand?.model || null;

  /* ============ THREE setup once ============ */
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
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
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
        const decalGroup = new THREE.Group();
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

        // build a bounding box from meshes, but drop ones that are absurdly
        // large compared to the rest (likely a ground plane / skybox)
        const tmp = new THREE.Box3();
        const sizes = meshes.map((m) => {
          tmp.setFromObject(m);
          const s = new THREE.Vector3();
          tmp.getSize(s);
          return Math.max(s.x, s.y, s.z) || 0;
        });
        const sorted = [...sizes].filter((v) => v > 0).sort((a, b) => a - b);
        const median = sorted[Math.floor(sorted.length / 2)] || 1;
        const keepThreshold = median * 4; // anything 4x bigger than median = junk

        const carBox = new THREE.Box3();
        let any = false;
        meshes.forEach((m, i) => {
          if (sizes[i] <= keepThreshold) {
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

        // collect clickable car meshes (the kept ones)
        meshes.forEach((m, i) => {
          if (sizes[i] <= keepThreshold) {
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
        setAutoSpin(true);
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
    const { THREE, decalGroup, textures } = t;
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
      const quat = new THREE.Quaternion().setFromUnitVectors(
        new THREE.Vector3(0, 0, 1),
        nrm,
      );

      // All decal dimensions are expressed as fractions of the car's local
      // radius — so a 0.1 (10%) decal looks the same on a small car and a big
      // one, and never blows up to swallow a panel.
      const R = t.localCarRadius || 2;
      const isElong = ELONGATED.has(m.type);
      const sizeFrac = Math.min(0.35, Math.max(0.025, m.size)); // 2.5%-35% of radius
      const lenFrac = Math.min(0.6, Math.max(0.04, m.length || sizeFrac));
      const width = isElong ? lenFrac * R : sizeFrac * R;
      const height = isElong ? sizeFrac * 0.6 * R : sizeFrac * R;

      // surface offset: small fraction of radius, never depends on decal size
      const offset = R * 0.004;

      const decal = new THREE.Mesh(
        new THREE.PlaneGeometry(width * 2, height * 2),
        new THREE.MeshBasicMaterial({
          map: textures[m.type] || textures.other,
          transparent: true,
          depthWrite: false,
          polygonOffset: true,
          polygonOffsetFactor: -8,
          polygonOffsetUnits: -8,
          opacity: 0.95,
        }),
      );
      decal.position.copy(pos).add(nrm.clone().multiplyScalar(offset));
      decal.quaternion.copy(quat);
      decal.rotateZ(m.rotation || 0);
      decal.userData.markId = m.id;
      decal.renderOrder = 10;
      decalGroup.add(decal);

      // Selection ring: CONSTANT size per car (small, professional).
      // Does NOT scale with the mark — solves the "huge bubble" problem.
      if (isSel) {
        const ringTex = new THREE.CanvasTexture(
          ringCanvasFor(type?.color || "#111"),
        );
        const ring = new THREE.Sprite(
          new THREE.SpriteMaterial({
            map: ringTex,
            depthTest: false,
            transparent: true,
          }),
        );
        const ringSize = R * 0.18; // ~18% of car radius — feels right at any zoom
        ring.scale.set(ringSize, ringSize, 1);
        ring.position
          .copy(pos)
          .add(nrm.clone().multiplyScalar(offset + R * 0.002));
        ring.userData.markId = m.id;
        ring.renderOrder = 12;
        decalGroup.add(ring);
      }

      // Number bead — small, constant per car, just above the decal
      const bead = new THREE.Sprite(
        new THREE.SpriteMaterial({
          map: new THREE.CanvasTexture(
            numberBead(idx + 1, type?.color || "#111"),
          ),
          depthTest: false,
          transparent: true,
        }),
      );
      const beadSize = R * 0.07;
      bead.scale.set(beadSize, beadSize, 1);
      bead.position
        .copy(pos)
        .add(nrm.clone().multiplyScalar(offset + R * 0.01))
        .add(new THREE.Vector3(0, Math.max(height, width) + R * 0.05, 0));
      bead.userData.markId = m.id;
      bead.renderOrder = 20;
      decalGroup.add(bead);
    });
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
      if (!activeVehicleIdRef.current) {
        toast.error("Bitte zuerst ein Fahrzeug wählen oder anlegen.");
        return;
      }

      const hits = t.raycaster.intersectObjects(t.carMeshes, true);
      if (hits.length) {
        const hit = hits[0];
        // make sure transforms are up to date before reading
        t.carGroup.updateMatrixWorld(true);
        const localPt = t.carGroup.worldToLocal(hit.point.clone());
        let nrmLocal = [0, 0, 1];
        if (hit.face) {
          const nWorld = hit.face.normal
            .clone()
            .transformDirection(hit.object.matrixWorld);
          const inv = new t.THREE.Matrix3()
            .getNormalMatrix(t.carGroup.matrixWorld)
            .invert();
          const nv = nWorld.applyMatrix3(inv).normalize();
          nrmLocal = [nv.x, nv.y, nv.z];
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
    if (ready !== true || !t.renderer) return;
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

  // ---- global (whole-car) actions per vehicle ----
  const activeGlobals = (activeVehicleId &&
    globalsByVehicle[activeVehicleId]) || { actions: {}, custom: [] };
  const [customGlobalInput, setCustomGlobalInput] = useState("");
  const globalsCount =
    Object.values(activeGlobals.actions || {}).filter(Boolean).length +
    (activeGlobals.custom?.length || 0);

  const setActiveGlobals = (updater) =>
    setGlobalsByVehicle((prev) => {
      if (!activeVehicleId) return prev;
      const cur = prev[activeVehicleId] || { actions: {}, custom: [] };
      const next = typeof updater === "function" ? updater(cur) : updater;
      return { ...prev, [activeVehicleId]: next };
    });
  const toggleGlobal = (id) =>
    setActiveGlobals((cur) => ({
      ...cur,
      actions: { ...(cur.actions || {}), [id]: !cur.actions?.[id] },
    }));
  const addCustomGlobal = () => {
    const v = customGlobalInput.trim();
    if (!v) return;
    setActiveGlobals((cur) => ({ ...cur, custom: [...(cur.custom || []), v] }));
    setCustomGlobalInput("");
  };
  const removeCustomGlobal = (i) =>
    setActiveGlobals((cur) => ({
      ...cur,
      custom: (cur.custom || []).filter((_, idx) => idx !== i),
    }));
  const clearAllAufgaben = () => {
    if (!confirm("Alle Aufgaben dieses Fahrzeugs entfernen?")) return;
    setMarks([]);
    setSelectedMark(null);
    setActiveGlobals({ actions: {}, custom: [] });
  };
  const selectMark = (id) => {
    setSelectedMark(id);
    const m = marks.find((x) => x.id === id);
    if (m) flyToMark(m);
  };

  /* ---- vehicle management ---- */
  const addVehicle = ({ brandId, name, fin }) => {
    const id = `v_${Date.now()}_${Math.random().toString(36).slice(2, 5)}`;
    const v = { id, brandId, name: name.trim(), fin: fin.trim() };
    setVehicles((prev) => [...prev, v]);
    setActiveVehicleId(id);
    setShowAdd(false);
    toast.success("Fahrzeug hinzugefügt");
  };
  const deleteVehicle = (id) => {
    if (!confirm("Dieses Fahrzeug entfernen?")) return;
    setVehicles((prev) => prev.filter((v) => v.id !== id));
    setMarksByVehicle((prev) => {
      const n = { ...prev };
      delete n[id];
      return n;
    });
    if (activeVehicleId === id) setActiveVehicleId(null);
  };

  const handleSave = async () => {
    const globals = {
      preset: Object.entries(activeGlobals.actions || {})
        .filter(([, on]) => on)
        .map(([id]) => id),
      custom: activeGlobals.custom || [],
    };
    const payload = {
      vehicle: activeVehicle,
      brand: activeBrand?.label,
      marks: marks.map(({ id, ...r }) => r),
      globals,
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
        : `
      <h2 style="font-size:13px;margin:24px 0 6px;letter-spacing:.08em;text-transform:uppercase;color:#475569">Gesamtfahrzeug</h2>
      <ul style="margin:0;padding-left:18px;font-size:13px">${globalRows.map((r) => `<li><b>${esc(r)}</b></li>`).join("")}</ul>`;
    const rows = marks
      .map((m, i) => {
        const tp = DAMAGE_TYPES.find((x) => x.id === m.type);
        const sv = SEVERITY.find((x) => x.id === m.severity);
        return `<tr><td>${i + 1}</td><td><span class="dot" style="background:${tp?.color}"></span>${esc(tp?.label)}</td><td>${esc(m.panel) || "—"}</td><td><b>${esc(m.action)}</b></td><td><span class="sev" style="color:${sv?.color}">${esc(sv?.label)}</span></td><td>${esc(m.note) || "—"}</td></tr>`;
      })
      .join("");
    const title = activeVehicle
      ? `${activeBrand?.label || ""} ${activeVehicle.name}`
      : "Fahrzeug";
    w.document
      .write(`<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Lackier-Auftrag</title><style>
      *{box-sizing:border-box}body{font-family:'Segoe UI',system-ui,sans-serif;color:#0f172a;padding:40px}
      .top{display:flex;justify-content:space-between;border-bottom:2px solid #0f172a;padding-bottom:14px}
      .brand{font-size:18px;font-weight:800;letter-spacing:.14em;text-transform:uppercase}.doc{font-size:11px;color:#64748b;text-transform:uppercase;letter-spacing:.16em;text-align:right}
      h1{font-size:24px;margin:18px 0 2px}.sub{color:#64748b;font-size:13px;margin-bottom:20px}
      table{width:100%;border-collapse:collapse;font-size:12.5px}th,td{text-align:left;padding:9px 10px;border-bottom:1px solid #e2e8f0;vertical-align:top}
      th{font-size:10px;text-transform:uppercase;letter-spacing:.1em;color:#64748b}.dot{display:inline-block;width:10px;height:10px;border-radius:50%;margin-right:8px;vertical-align:middle}
      .sev{font-weight:700}.foot{margin-top:30px;font-size:11px;color:#94a3b8;border-top:1px solid #e2e8f0;padding-top:12px}
      </style></head><body onload="window.print();window.onafterprint=()=>window.close()">
      <div class="top"><div class="brand">Autogalerie Jülich</div><div class="doc">Lackier- & Reparatur-Auftrag<br/>${new Date().toLocaleDateString("de-DE")}</div></div>
      <h1>${esc(title)}</h1><div class="sub">${activeVehicle?.fin ? "FIN " + esc(activeVehicle.fin) + " · " : ""}${marks.length} Position(en) · ${globalRows.length} Gesamt-Maßnahme(n)</div>
      ${globalsHtml}
      <h2 style="font-size:13px;margin:24px 0 6px;letter-spacing:.08em;text-transform:uppercase;color:#475569">Einzelpositionen</h2>
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

      <div className="relative mx-auto w-full max-w-[1600px] px-4 sm:px-6 py-5">
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
                Fahrzeug wählen oder anlegen · Schäden markieren · an die
                Werkstatt übergeben
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSave}
              disabled={!activeVehicle}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg bg-blue-600 px-3.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-40"
            >
              <FiSave size={14} /> Speichern
            </button>
            <button
              onClick={handlePrint}
              disabled={!activeVehicle}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3.5 text-xs font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 disabled:opacity-40"
            >
              <FiPrinter size={14} /> Auftrag
            </button>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-5 lg:grid-cols-[240px_1fr_340px]">
          {/* TREE */}
          <VehicleTree
            brands={BRANDS}
            vehicles={vehicles}
            activeVehicleId={activeVehicleId}
            onSelect={setActiveVehicleId}
            onAdd={() => setShowAdd(true)}
            onDeleteVehicle={deleteVehicle}
            marksByVehicle={marksByVehicle}
          />

          {/* CENTER: viewer + details strip */}
          <div className="flex flex-col gap-4">
            <section className="relative overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,.06),0_12px_40px_-12px_rgba(15,23,42,.12)]">
              <div
                ref={mountRef}
                className="relative aspect-[16/9] w-full touch-none"
                style={{
                  background: "linear-gradient(180deg,#ffffff 0%,#eef2f7 100%)",
                  cursor: placing ? "crosshair" : "grab",
                }}
              >
                {!activeVehicle && sceneReady && !errored && (
                  <div className="absolute inset-0 grid place-items-center px-6">
                    <div className="flex max-w-xs flex-col items-center gap-3 text-center">
                      <div className="grid h-12 w-12 place-items-center rounded-full bg-slate-100 text-slate-400">
                        <FiTruck size={22} />
                      </div>
                      <p className="text-xs text-slate-500">
                        Kein Fahrzeug gewählt. Wähle links ein Fahrzeug oder
                        lege ein neues an.
                      </p>
                      <button
                        onClick={() => setShowAdd(true)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700"
                      >
                        <FiPlusCircle size={14} /> Fahrzeug anlegen
                      </button>
                    </div>
                  </div>
                )}
                {activeVehicle && ready !== true && !errored && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="flex flex-col items-center gap-3">
                      <div className="h-7 w-7 animate-spin rounded-full border-2 border-slate-200 border-t-blue-600" />
                      <span className="text-xs text-slate-400">
                        {loadingMsg}
                      </span>
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
                        Prüfe den Modellpfad der Marke und CORS.
                      </p>
                    </div>
                  </div>
                )}
                {ready === true && activeVehicle && (
                  <>
                    <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
                      <span
                        className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium shadow-sm ${placing ? "bg-blue-600 text-white" : "border border-slate-200 bg-white/90 text-slate-600"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${placing ? "bg-white" : "bg-slate-400"}`}
                        />
                        {placing ? "Markier-Modus" : "Nur Ansicht"}
                      </span>
                      <span className="rounded-full border border-slate-200 bg-white/90 px-2.5 py-1 text-[11px] font-medium text-slate-600 shadow-sm">
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
                    <div className="pointer-events-none absolute inset-x-0 bottom-3 flex justify-center">
                      <span className="rounded-full border border-slate-200/70 bg-white/85 px-3 py-1 text-[11px] text-slate-500 backdrop-blur-sm">
                        {placing
                          ? "Auf die beschädigte Stelle klicken — Größe & Richtung rechts anpassen"
                          : "Ziehen zum Drehen · Scrollen zum Zoomen"}
                      </span>
                    </div>
                    {marks.length > 0 && (
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
                  </>
                )}
              </div>
            </section>

            {/* DETAILS + AUFGABEN SUMMARY (below the viewer) */}
            {activeVehicle && (
              <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {/* details */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,.05)]">
                  <div className="mb-3 flex items-center gap-2">
                    <FiTruck className="text-slate-400" size={14} />
                    <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
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

                {/* AUFGABEN — the actual list, not a summary */}
                <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-[0_1px_3px_rgba(15,23,42,.05)]">
                  <div className="mb-3 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <FiClipboard className="text-slate-400" size={14} />
                      <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                        Aufgaben · {marks.length + globalsCount}
                      </h2>
                    </div>
                    {(marks.length > 0 || globalsCount > 0) && (
                      <button
                        onClick={clearAllAufgaben}
                        className="text-[11px] font-medium text-red-600 hover:text-red-700"
                      >
                        Alle löschen
                      </button>
                    )}
                  </div>

                  {marks.length === 0 && globalsCount === 0 ? (
                    <p className="py-2 text-[11px] text-slate-400">
                      Noch keine Aufgaben.
                    </p>
                  ) : (
                    <ul className="-mx-1 max-h-72 space-y-0.5 overflow-auto px-1">
                      {/* whole-car preset actions */}
                      {Object.entries(activeGlobals.actions || {})
                        .filter(([, on]) => on)
                        .map(([id]) => {
                          const g = GLOBAL_ACTIONS.find((x) => x.id === id);
                          return (
                            <li
                              key={`g_${id}`}
                              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs hover:bg-slate-50"
                            >
                              <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-md bg-blue-600 text-[10px] text-white">
                                {g?.icon}
                              </span>
                              <span className="flex-1 truncate font-semibold text-slate-700">
                                {g?.label}
                              </span>
                              <span className="rounded bg-blue-50 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-blue-700">
                                Gesamt
                              </span>
                              <button
                                onClick={() => toggleGlobal(id)}
                                className="text-slate-300 hover:text-red-500"
                              >
                                <FiX size={12} />
                              </button>
                            </li>
                          );
                        })}
                      {(activeGlobals.custom || []).map((c, i) => (
                        <li
                          key={`gc_${i}`}
                          className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-xs hover:bg-slate-50"
                        >
                          <span className="grid h-5 w-5 flex-shrink-0 place-items-center rounded-md bg-slate-900 text-[10px] text-white">
                            ★
                          </span>
                          <span className="flex-1 truncate font-semibold text-slate-700">
                            {c}
                          </span>
                          <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-slate-600">
                            Gesamt
                          </span>
                          <button
                            onClick={() => removeCustomGlobal(i)}
                            className="text-slate-300 hover:text-red-500"
                          >
                            <FiX size={12} />
                          </button>
                        </li>
                      ))}
                      {/* per-mark positions */}
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

                  {/* severity tally */}
                  {marks.length > 0 && (
                    <div className="mt-3 flex flex-wrap gap-3 border-t border-slate-100 pt-3">
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
                            updateMark(selected.id, {
                              type: t.id,
                              length: ELONGATED.has(t.id)
                                ? Math.max(selected.length || 0.14, 0.1)
                                : selected.size,
                            })
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

                  {ELONGATED.has(selected.type) ? (
                    <>
                      <Field
                        label={`Länge · ${(selected.length * 200).toFixed(0)} cm`}
                      >
                        <input
                          type="range"
                          min={0.03}
                          max={0.6}
                          step={0.005}
                          value={selected.length}
                          onChange={(e) =>
                            updateMark(selected.id, {
                              length: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-blue-600"
                        />
                      </Field>
                      <Field
                        label={`Stärke · ${(selected.size * 200).toFixed(1)} cm`}
                      >
                        <input
                          type="range"
                          min={0.012}
                          max={0.1}
                          step={0.002}
                          value={selected.size}
                          onChange={(e) =>
                            updateMark(selected.id, {
                              size: parseFloat(e.target.value),
                            })
                          }
                          className="w-full accent-blue-600"
                        />
                      </Field>
                    </>
                  ) : (
                    <Field
                      label={`Größe · ${(selected.size * 200).toFixed(0)} cm`}
                    >
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() =>
                            updateMark(selected.id, {
                              size: Math.max(
                                0.02,
                                +(selected.size - 0.01).toFixed(3),
                              ),
                            })
                          }
                          className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                        >
                          <FiMinus size={13} />
                        </button>
                        <input
                          type="range"
                          min={0.02}
                          max={0.35}
                          step={0.005}
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
                                0.35,
                                +(selected.size + 0.01).toFixed(3),
                              ),
                            })
                          }
                          className="grid h-7 w-7 place-items-center rounded-md border border-slate-200 text-slate-500 hover:bg-slate-50"
                        >
                          <FiPlus size={13} />
                        </button>
                      </div>
                    </Field>
                  )}

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
                    {activeVehicle
                      ? "Wähle eine Markierung, um Größe, Ausrichtung und Maßnahme festzulegen."
                      : "Wähle zuerst ein Fahrzeug."}
                  </p>
                </div>
              </Panel>
            )}

            {/* Gesamtfahrzeug-Maßnahmen */}
            {activeVehicle && (
              <Panel title="Gesamtfahrzeug-Maßnahmen">
                <div className="grid grid-cols-2 gap-1.5">
                  {GLOBAL_ACTIONS.map((g) => {
                    const on = !!activeGlobals.actions?.[g.id];
                    return (
                      <button
                        key={g.id}
                        onClick={() => toggleGlobal(g.id)}
                        className={`flex items-center gap-2 rounded-lg border px-2.5 py-2 text-left text-[11px] font-medium transition ${on ? "border-blue-600 bg-blue-50 text-blue-700" : "border-slate-200 bg-white text-slate-700 hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        <span className="text-base leading-none">{g.icon}</span>
                        <span className="flex-1">{g.label}</span>
                        {on && (
                          <span className="h-1.5 w-1.5 rounded-full bg-blue-600" />
                        )}
                      </button>
                    );
                  })}
                </div>
                {/* custom global action input */}
                <div className="mt-2 flex gap-1.5">
                  <input
                    value={customGlobalInput}
                    onChange={(e) => setCustomGlobalInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") addCustomGlobal();
                    }}
                    placeholder="Eigene Maßnahme hinzufügen…"
                    className="flex-1 rounded-lg border border-slate-200 px-2.5 py-1.5 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                  />
                  <button
                    onClick={addCustomGlobal}
                    disabled={!customGlobalInput.trim()}
                    className="grid h-8 w-8 place-items-center rounded-lg bg-slate-900 text-white transition hover:bg-black disabled:opacity-40"
                  >
                    <FiPlus size={14} />
                  </button>
                </div>
                {activeGlobals.custom?.length > 0 && (
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    {activeGlobals.custom.map((c, i) => (
                      <span
                        key={i}
                        className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-slate-50 px-2 py-1 text-[11px] text-slate-700"
                      >
                        {c}
                        <button
                          onClick={() => removeCustomGlobal(i)}
                          className="text-slate-400 hover:text-red-500"
                        >
                          <FiX size={11} />
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </Panel>
            )}

            {/* AUFGABEN — merged list (per-mark positions + global actions) */}
          </aside>
        </div>
      </div>

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
function AddVehicleModal({ brands, onClose, onAdd }) {
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [name, setName] = useState("");
  const [fin, setFin] = useState("");
  const valid = brandId && name.trim();

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-slate-900/40 p-4 backdrop-blur-sm">
      <div className="w-full max-w-sm rounded-2xl border border-slate-200 bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3.5">
          <h3 className="text-sm font-semibold text-slate-800">
            Neues Fahrzeug
          </h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600"
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
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </Field>
          <Field label="FIN (optional)">
            <input
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              placeholder="z. B. WDC2049811A123456"
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-xs font-mono outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            />
          </Field>
          {brands.length === 0 && (
            <p className="text-[11px] text-red-500">
              Keine Marken definiert. Trage zuerst eine Marke in{" "}
              <code>BRANDS</code> ein.
            </p>
          )}
        </div>
        <div className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">
          <button
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50"
          >
            Abbrechen
          </button>
          <button
            onClick={() => valid && onAdd({ brandId, name, fin })}
            disabled={!valid}
            className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-40"
          >
            Hinzufügen
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
}) {
  const [query, setQuery] = useState("");
  const [openBrands, setOpenBrands] = useState({});

  const byBrand = useMemo(() => {
    const g = {};
    brands.forEach((b) => (g[b.id] = []));
    vehicles.forEach((v) => {
      if (
        query &&
        !`${v.name} ${v.fin}`.toLowerCase().includes(query.toLowerCase())
      )
        return;
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
    <aside className="flex flex-col rounded-2xl border border-slate-200 bg-white shadow-[0_1px_3px_rgba(15,23,42,.05)]">
      <div className="flex items-center justify-between border-b border-slate-100 px-3.5 py-3">
        <h2 className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
          Fahrzeuge
        </h2>
        <button
          onClick={onAdd}
          title="Fahrzeug hinzufügen"
          className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2 py-1 text-[10px] font-semibold text-white hover:bg-blue-700"
        >
          <FiPlus size={12} /> Neu
        </button>
      </div>

      <div className="px-3 pt-3">
        <div className="relative">
          <FiSearch
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400"
            size={13}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen…"
            className="h-8 w-full rounded-lg border border-slate-200 pl-7 pr-2 text-xs outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 placeholder:text-slate-400"
          />
        </div>
      </div>

      <div className="flex-1 overflow-auto p-2">
        {brands.length === 0 ? (
          <p className="px-2 py-4 text-center text-[11px] text-slate-400">
            Keine Marken definiert.
          </p>
        ) : (
          brands.map((brand) => {
            const cars = byBrand[brand.id] || [];
            const open = openBrands[brand.id] ?? false;
            return (
              <div key={brand.id} className="mb-0.5">
                <button
                  onClick={() => toggle(brand.id)}
                  className="flex w-full items-center gap-1.5 rounded-lg px-2 py-1.5 text-left text-xs font-semibold text-slate-700 transition hover:bg-slate-50"
                >
                  {open ? (
                    <FiChevronDown
                      size={13}
                      className="flex-shrink-0 text-slate-400"
                    />
                  ) : (
                    <FiChevronRight
                      size={13}
                      className="flex-shrink-0 text-slate-400"
                    />
                  )}
                  {open ? (
                    <FiFolderPlus
                      size={15}
                      className="flex-shrink-0 text-blue-500"
                    />
                  ) : (
                    <FiFolder
                      size={15}
                      className="flex-shrink-0 text-slate-400"
                    />
                  )}
                  <span className="flex-1 truncate">{brand.label}</span>
                  <span className="rounded-full bg-slate-100 px-1.5 py-0.5 text-[9px] tabular-nums text-slate-500">
                    {cars.length}
                  </span>
                </button>
                {open &&
                  (cars.length === 0 ? (
                    <p className="ml-7 py-1.5 text-[10.5px] text-slate-400">
                      Noch keine Fahrzeuge.
                    </p>
                  ) : (
                    <ul className="ml-3 border-l border-slate-100 pl-1.5">
                      {cars.map((v) => {
                        const on = v.id === activeVehicleId;
                        const n = marksByVehicle[v.id]?.length || 0;
                        return (
                          <li key={v.id} className="group/leaf">
                            <div
                              className={`flex items-center gap-1 rounded-lg pr-1 transition ${on ? "bg-blue-50 ring-1 ring-blue-200" : "hover:bg-slate-50"}`}
                            >
                              <button
                                onClick={() => onSelect(v.id)}
                                className={`flex min-w-0 flex-1 items-center gap-2 px-2 py-1.5 text-left text-xs ${on ? "font-medium text-blue-700" : "text-slate-600"}`}
                              >
                                <FiTruck
                                  size={13}
                                  className={`flex-shrink-0 ${on ? "text-blue-500" : "text-slate-400"}`}
                                />
                                <span className="min-w-0 flex-1">
                                  <span className="block truncate">
                                    {v.name}
                                  </span>
                                  {v.fin && (
                                    <span className="block truncate text-[9.5px] font-normal text-slate-400">
                                      {v.fin}
                                    </span>
                                  )}
                                </span>
                                {n > 0 && (
                                  <span
                                    className={`flex-shrink-0 rounded-full px-1.5 py-0.5 text-[9px] tabular-nums ${on ? "bg-blue-100 text-blue-600" : "bg-slate-100 text-slate-500"}`}
                                  >
                                    {n}
                                  </span>
                                )}
                              </button>
                              <button
                                onClick={() => onDeleteVehicle(v.id)}
                                title="Entfernen"
                                className="flex-shrink-0 rounded p-1 text-slate-300 opacity-0 transition hover:text-red-500 group-hover/leaf:opacity-100"
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
          })
        )}
      </div>

      <div className="border-t border-slate-100 px-3.5 py-2.5">
        <p className="text-[10px] leading-relaxed text-slate-400">
          Marken-Modelle definierst du in{" "}
          <code className="rounded bg-slate-100 px-1 text-[9px]">BRANDS</code>.
          Fahrzeuge legst du hier mit „Neu" an.
        </p>
      </div>
    </aside>
  );
}

/* damage textures */
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
  const dent = tex((ctx) => {
    const g = ctx.createRadialGradient(S / 2, S / 2, 6, S / 2, S / 2, S / 2.2);
    g.addColorStop(0, "rgba(120,72,8,0.55)");
    g.addColorStop(0.5, "rgba(245,158,11,0.30)");
    g.addColorStop(1, "rgba(245,158,11,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(S / 2, S / 2, S / 2.1, 0, Math.PI * 2);
    ctx.fill();
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
  const crack = tex((ctx) => {
    ctx.strokeStyle = "rgba(124,58,237,0.95)";
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
function ringCanvasFor(color) {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  ctx.strokeStyle = color;
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 6, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(S / 2, S / 2, S / 2 - 6, 0, Math.PI * 2);
  ctx.stroke();
  return c;
}
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

/* UI primitives */
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
function DetailRow({ label, value, mono }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-slate-400">{label}</span>
      <span
        className={`font-medium text-slate-700 ${mono ? "font-mono text-[11px]" : ""} truncate`}
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
        className="w-full appearance-none rounded-lg border border-slate-200 bg-white px-3 py-2 pr-8 text-xs font-medium text-slate-700 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
      >
        {options.map((o) => (
          <option key={o || "_"} value={o}>
            {render ? render(o) : o === "" ? placeholder || "—" : o}
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

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
  FiMenu,
  FiCamera,
  FiUploadCloud,
  FiImage,
  FiExternalLink,
} from "react-icons/fi";

const BRANDS = [
  {
    id: "mercedes",
    label: "Mercedes-Benz",
    model: "/uploads_files_5489305_Glk.glb",
  },
  { id: "mercedes1", label: "Mercedes-Benz 1", model: "/mercedes.glb" },
  { id: "peugeot", label: "Peugeot", model: "/peugeot.glb" },
  { id: "ford", label: "Ford", model: "/fordfocus.glb" },
  { id: "hyundai", label: "Hyundai", model: "/hyundai.glb" },
  { id: "opel", label: "Opel", model: "/opel.glb" },
  { id: "kia", label: "Kia", model: "/kiapicanto.glb" },
  { id: "kia1", label: "Kia 1", model: "/kiapicanto1.glb" },
  { id: "mazda", label: "Mazda", model: "/mazda.glb" },
  { id: "volkswagen", label: "Volkswagen", model: "/volkswagen.glb" },
];

const DAMAGE_TYPES = [
  { id: "scratch", label: "Kratzer", color: "#0284c7" },
  { id: "dent", label: "Delle", color: "#d97706" },
  { id: "paint", label: "Lackschaden", color: "#dc2626" },
  { id: "rust", label: "Rost", color: "#92400e" },
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
  size: 0.06,
  length: ELONGATED.has(type) ? 0.14 : 0.06,
  rotation: 0,
  done: false,
});

/* ─── Utility ─────────────────────────────────────────── */
function parsePrice(v) {
  const n = Number.parseFloat(String(v ?? "").replace(",", "."));
  return Number.isFinite(n) ? n : 0;
}
function formatEuro(v) {
  return parsePrice(v).toLocaleString("de-DE", {
    style: "currency",
    currency: "EUR",
  });
}
function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

/* ─── Main Page ────────────────────────────────────────── */
export default function VehicleInspection3DPage() {
  const [vehicles, setVehicles] = useState([]);
  const [activeVehicleId, setActiveVehicleId] = useState(null);
  const [dataLoading, setDataLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [mobileTreeOpen, setMobileTreeOpen] = useState(false);

  const activeVehicle = vehicles.find((v) => v.id === activeVehicleId) || null;
  const activeBrand = activeVehicle
    ? BRANDS.find((b) => b.id === activeVehicle.brandId)
    : null;

  const [marksByVehicle, setMarksByVehicle] = useState({});
  const [mechanicalByVehicle, setMechanicalByVehicle] = useState({});
  const [photosByVehicle, setPhotosByVehicle] = useState({});
  const [uploadingPhotos, setUploadingPhotos] = useState(false);
  const photoInputRef = useRef(null);
  const marks = (activeVehicleId && marksByVehicle[activeVehicleId]) || [];
  const mechanicalTasks =
    (activeVehicleId && mechanicalByVehicle[activeVehicleId]) || [];
  const beforeRepairPhotos =
    (activeVehicleId && photosByVehicle[activeVehicleId]) || [];
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
  const [activeTab, setActiveTab] = useState("bodywork");

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
    setVehicles((cur) => {
      const exists = cur.some((i) => i.id === id);
      return exists
        ? cur.map((i) => (i.id === id ? vehicle : i))
        : [vehicle, ...cur];
    });
    setMarksByVehicle((cur) => ({
      ...cur,
      [id]: Array.isArray(inspection.bodywork) ? inspection.bodywork : [],
    }));
    setMechanicalByVehicle((cur) => ({
      ...cur,
      [id]: Array.isArray(inspection.mechanicalTasks)
        ? inspection.mechanicalTasks
        : [],
    }));
    setPhotosByVehicle((cur) => ({
      ...cur,
      [id]: Array.isArray(inspection.beforeRepairPhotos)
        ? inspection.beforeRepairPhotos
        : [],
    }));
    return vehicle;
  }, []);

  useEffect(() => {
    const ctrl = new AbortController();
    (async () => {
      try {
        setDataLoading(true);
        const res = await fetch("/api/workshop-inspections", {
          cache: "no-store",
          signal: ctrl.signal,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message || "Fehler beim Laden.");
        const inspections = Array.isArray(data.inspections)
          ? data.inspections
          : [];
        const nv = [],
          nm = {},
          nk = {},
          np = {};
        inspections.forEach((ins) => {
          const id = String(ins.id || ins._id);
          nv.push({
            id,
            brandId: ins.vehicle?.brandId || "",
            name: ins.vehicle?.name || "",
            fin: ins.vehicle?.fin || "",
            status: ins.status || "draft",
            createdAt: ins.createdAt,
            updatedAt: ins.updatedAt,
          });
          nm[id] = Array.isArray(ins.bodywork) ? ins.bodywork : [];
          nk[id] = Array.isArray(ins.mechanicalTasks)
            ? ins.mechanicalTasks
            : [];
          np[id] = Array.isArray(ins.beforeRepairPhotos)
            ? ins.beforeRepairPhotos
            : [];
        });
        setVehicles(nv);
        setMarksByVehicle(nm);
        setMechanicalByVehicle(nk);
        setPhotosByVehicle(np);
        setActiveVehicleId((cur) =>
          cur && nv.some((v) => v.id === cur) ? cur : nv[0]?.id || null,
        );
      } catch (e) {
        if (e.name !== "AbortError")
          toast.error(e.message || "Fehler beim Laden.");
      } finally {
        if (!ctrl.signal.aborted) setDataLoading(false);
      }
    })();
    return () => ctrl.abort();
  }, []);

  /* THREE setup */
  useEffect(() => {
    let disposed = false,
      cleanup = () => {};
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
        const w = mount.clientWidth,
          h = mount.clientHeight;
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(40, w / h, 0.1, 1000);
        camera.position.set(5.4, 2.5, 6.4);
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
        });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.setSize(w, h);
        renderer.shadowMap.enabled = true;
        renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        mount.appendChild(renderer.domElement);
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(
          new RoomEnvironment(),
          0.04,
        ).texture;
        scene.add(new THREE.HemisphereLight(0xffffff, 0xf0f0f0, 0.55));
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
          new THREE.CircleGeometry(10, 80),
          new THREE.MeshStandardMaterial({
            color: 0xf5f5f5,
            roughness: 0.95,
            metalness: 0,
          }),
        );
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        scene.add(floor);
        const ring = new THREE.Mesh(
          new THREE.RingGeometry(2.95, 3.0, 80),
          new THREE.MeshBasicMaterial({
            color: 0x1d4ed8,
            transparent: true,
            opacity: 0.25,
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
          const wr = mount.clientWidth,
            hr = mount.clientHeight;
          camera.aspect = wr / hr;
          camera.updateProjectionMatrix();
          renderer.setSize(wr, hr);
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

  /* load/swap model */
  useEffect(() => {
    const t = three.current;
    if (!sceneReady || !t.initialized) return;
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
        const meshes = [];
        const tmp = new THREE.Box3();
        gltf.scene.updateWorldMatrix(true, true);
        gltf.scene.traverse((o) => {
          if (o.isMesh && o.geometry) {
            o.geometry.computeBoundingBox?.();
            meshes.push(o);
          }
        });
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
        if (!any) carBox.setFromObject(gltf.scene);
        const size = new THREE.Vector3();
        carBox.getSize(size);
        const maxDim = Math.max(size.x, size.y, size.z) || 1;
        carGroup.scale.setScalar(3.6 / maxDim);
        const box2 = new THREE.Box3().setFromObject(carGroup);
        const c2 = new THREE.Vector3();
        box2.getCenter(c2);
        carGroup.position.x -= c2.x;
        carGroup.position.z -= c2.z;
        carGroup.position.y -= box2.min.y;
        meshes.forEach((m, i) => {
          if (!isBackdrop(i)) {
            m.castShadow = true;
            m.receiveShadow = true;
            t.carMeshes.push(m);
          }
        });
        if (t.carMeshes.length === 0)
          gltf.scene.traverse((o) => {
            if (o.isMesh) t.carMeshes.push(o);
          });
        const fitBox = new THREE.Box3().setFromObject(carGroup);
        const center = new THREE.Vector3();
        fitBox.getCenter(center);
        const sphere = fitBox.getBoundingSphere(new THREE.Sphere());
        const r = sphere.radius || 2;
        const fov = (t.camera.fov * Math.PI) / 180;
        const fitDist = (r / Math.sin(fov / 2)) * 1.15;
        t.localCarRadius = r / (carGroup.scale.x || 1) || 2;
        t.controls.target.copy(center);
        t.controls.minDistance = r * 0.6;
        t.controls.maxDistance = fitDist * 3;
        const dirv = new THREE.Vector3(0.8, 0.45, 1).normalize();
        t.camera.position.copy(center).add(dirv.multiplyScalar(fitDist));
        t.camera.near = Math.max(0.01, r / 100);
        t.camera.far = fitDist * 10;
        t.camera.updateProjectionMatrix();
        t.controls.update();
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

  useEffect(() => {
    const t = three.current;
    if (!t.decalGroup || !t.THREE || ready !== true) return;
    const { decalGroup } = t;
    disposeMarkGroup(decalGroup);
    marks.forEach((m, idx) =>
      addMarkVisual(t, decalGroup, m, idx + 1, m.id === selectedMark, false),
    );
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

  useEffect(() => {
    const t = three.current;
    if (ready !== true || !t.renderer || !t.THREE) return;
    const THREE = t.THREE;
    const el = t.renderer.domElement;
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const R = () => t.localCarRadius || 2;
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
      let nrmLocal = new THREE.Vector3(0, 0, 1),
        nrmWorld = new THREE.Vector3(0, 0, 1);
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
    let g = null;
    const TH = 5;
    let rafId = 0,
      pending = null;
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
        const cur = m.rotation || 0,
          half = (m.length || 0.14) * R();
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
      const u = rel.dot(b.ex),
        v = rel.dot(b.ey);
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
      const hk = hitHandle();
      if (hk && beginResize(hk, e)) {
        e.preventDefault();
        return;
      }
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
          if (cur.wasSelected) setSelectedMark(null);
          else setSelectedMark(cur.id);
        }
        return;
      }
      if (cur.moved) return;
      if (!stateRef.current.placing) {
        if (selectedMarkRef.current) setSelectedMark(null);
        return;
      }
      if (!activeVehicleIdRef.current) {
        toast.error("Bitte zuerst ein Fahrzeug wählen.");
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
      setSelectedMark(null);
      toast.success("Schadensposition gesetzt.", {
        id: "placed",
        duration: 1200,
      });
    };
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
    if (marks.length && confirm("Alle Markierungen entfernen?")) {
      setMarks([]);
      setSelectedMark(null);
    }
  };

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
    if (!job) return toast.error("Bitte eine Arbeit eintragen.");
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
    setMechanicalDraft((d) => ({ ...d, job: "", note: "", price: "" }));
  };
  const updateMechanicalTask = (id, patch) =>
    setMechanicalTasks((cur) =>
      cur.map((t) => (t.id === id ? { ...t, ...patch } : t)),
    );
  const removeMechanicalTask = (id) =>
    setMechanicalTasks((cur) => cur.filter((t) => t.id !== id));
  const clearAllAufgaben = () => {
    if (!confirm("Alle Aufgaben entfernen?")) return;
    setMarks([]);
    setSelectedMark(null);
    setMechanicalTasks([]);
  };
  const selectMark = (id) => {
    setSelectedMark(id);
    const m = marks.find((x) => x.id === id);
    if (m) flyToMark(m);
  };

  const addVehicle = async ({ brandId, name, fin }) => {
    const brand = BRANDS.find((b) => b.id === brandId);
    const cleanName = String(name || "").trim();
    const cleanFin = String(fin || "")
      .trim()
      .toUpperCase();
    if (!brand) return toast.error("Bitte eine Marke wählen.");
    if (!cleanName) return toast.error("Bitte eine Bezeichnung eintragen.");
    try {
      const res = await fetch("/api/workshop-inspections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: {
            brandId: brand.id,
            brandLabel: brand.label,
            name: cleanName,
            fin: cleanFin,
          },
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Fehler.");
      const vehicle = applyInspectionToState(data.inspection);
      setActiveVehicleId(vehicle.id);
      setSelectedMark(null);
      setShowAdd(false);
      toast.success("Fahrzeug angelegt");
    } catch (e) {
      toast.error(e.message || "Fehler beim Anlegen.");
    }
  };

  const deleteVehicle = async (id) => {
    if (!confirm("Fahrzeug und alle Daten entfernen?")) return;
    try {
      const res = await fetch(`/api/workshop-inspections/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Fehler.");
      const remaining = vehicles.filter((v) => v.id !== id);
      setVehicles(remaining);
      setMarksByVehicle((cur) => {
        const n = { ...cur };
        delete n[id];
        return n;
      });
      setMechanicalByVehicle((cur) => {
        const n = { ...cur };
        delete n[id];
        return n;
      });
      setPhotosByVehicle((cur) => {
        const n = { ...cur };
        delete n[id];
        return n;
      });
      if (activeVehicleId === id) {
        setActiveVehicleId(remaining[0]?.id || null);
        setSelectedMark(null);
      }
      toast.success("Fahrzeug gelöscht");
    } catch (e) {
      toast.error(e.message || "Fehler.");
    }
  };

  const handlePhotoSelection = async (event) => {
    const files = Array.from(event.target.files || []);
    event.target.value = "";

    if (!activeVehicle || files.length === 0) return;

    const invalid = files.find(
      (file) => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024,
    );
    if (invalid) {
      toast.error("Nur Bilddateien bis maximal 10 MB pro Foto sind erlaubt.");
      return;
    }

    try {
      setUploadingPhotos(true);
      const formData = new FormData();
      files.forEach((file) => formData.append("photos", file));

      const res = await fetch(
        `/api/workshop-inspections/${activeVehicle.id}/photos`,
        { method: "POST", body: formData },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Upload fehlgeschlagen.");

      applyInspectionToState(data.inspection);
      toast.success(data.message || "Fotos hochgeladen.");
    } catch (error) {
      toast.error(error.message || "Fotos konnten nicht hochgeladen werden.");
    } finally {
      setUploadingPhotos(false);
    }
  };

  const deleteBeforeRepairPhoto = async (photo) => {
    if (!activeVehicle || !photo?.publicId) return;
    if (!confirm("Dieses Foto endgültig löschen?")) return;

    try {
      const res = await fetch(
        `/api/workshop-inspections/${activeVehicle.id}/photos`,
        {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ publicId: photo.publicId }),
        },
      );
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Löschen fehlgeschlagen.");

      applyInspectionToState(data.inspection);
      toast.success("Foto gelöscht.");
    } catch (error) {
      toast.error(error.message || "Foto konnte nicht gelöscht werden.");
    }
  };

  const bodyworkTotal = useMemo(
    () => marks.reduce((s, m) => s + parsePrice(m.price), 0),
    [marks],
  );
  const mechanicalTotal = useMemo(
    () => mechanicalTasks.reduce((s, t) => s + parsePrice(t.price), 0),
    [mechanicalTasks],
  );
  const workshopTotal = bodyworkTotal + mechanicalTotal;

  const handleSave = async () => {
    if (!activeVehicle) return;
    try {
      setSaving(true);
      const res = await fetch(`/api/workshop-inspections/${activeVehicle.id}`, {
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
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Fehler.");
      applyInspectionToState(data.inspection);
      toast.success("Gespeichert");
    } catch (e) {
      toast.error(e.message || "Fehler beim Speichern.");
    } finally {
      setSaving(false);
    }
  };

  const handleStatusChange = async (vehicleId, nextStatus) => {
    const vehicle = vehicles.find((item) => item.id === vehicleId);
    if (!vehicle) return;

    const vehicleBrand = BRANDS.find((brand) => brand.id === vehicle.brandId);
    const vehicleMarks = marksByVehicle[vehicleId] || [];
    const vehicleTasks = mechanicalByVehicle[vehicleId] || [];

    try {
      setSaving(true);
      const res = await fetch(`/api/workshop-inspections/${vehicleId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicle: {
            brandId: vehicle.brandId,
            brandLabel: vehicleBrand?.label || "",
            name: vehicle.name,
            fin: vehicle.fin || "",
          },
          bodywork: vehicleMarks,
          mechanicalTasks: vehicleTasks,
          status: nextStatus,
        }),
      });

      const data = await res.json();
      if (!res.ok)
        throw new Error(data.message || "Status konnte nicht geändert werden.");

      applyInspectionToState(data.inspection);
      toast.success(
        nextStatus === "completed"
          ? "Fahrzeug als abgeschlossen markiert."
          : "Fahrzeug wieder als offen markiert.",
      );
    } catch (error) {
      toast.error(error.message || "Status konnte nicht geändert werden.");
    } finally {
      setSaving(false);
    }
  };

  const handlePrint = () => {
    const w = window.open("", "_blank", "width=960,height=1200");
    if (!w) return toast.error("Popup blockiert.");
    const esc = (v) =>
      String(v ?? "").replace(
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
    const bodyRows = marks
      .map((m, i) => {
        const tp = DAMAGE_TYPES.find((t) => t.id === m.type);
        return `<tr><td>${i + 1}</td><td><span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${tp?.color};margin-right:6px;"></span>${esc(tp?.label)}</td><td>${esc(m.panel) || "—"}</td><td>${esc(m.action)}</td><td>${esc(m.note) || "—"}</td><td style="text-align:right">${formatEuro(m.price)}</td></tr>`;
      })
      .join("");
    const mechRows = mechanicalTasks
      .map(
        (t, i) =>
          `<tr><td>${i + 1}</td><td>${esc(t.area)}</td><td>${esc(t.job)}</td><td>${esc(t.note) || "—"}</td><td>${t.done ? "✓ Erledigt" : "Offen"}</td><td style="text-align:right">${formatEuro(t.price)}</td></tr>`,
      )
      .join("");
    const title = activeVehicle
      ? `${activeBrand?.label || ""} ${activeVehicle.name}`
      : "Fahrzeug";
    w.document.write(
      `<!DOCTYPE html><html lang="de"><head><meta charset="UTF-8"><title>Werkstattauftrag</title><style>*{box-sizing:border-box;margin:0;padding:0}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;font-size:12px;color:#111;padding:32px;background:#fff}.header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:16px;border-bottom:2px solid #111;margin-bottom:24px}.co{font-size:16px;font-weight:700;letter-spacing:.05em}.meta{font-size:10px;color:#666;text-align:right}h1{font-size:20px;font-weight:600;margin-bottom:4px}.sub{font-size:11px;color:#666;margin-bottom:20px}h2{font-size:10px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;color:#666;margin:20px 0 8px}table{width:100%;border-collapse:collapse}th{font-size:9px;font-weight:600;text-transform:uppercase;letter-spacing:.06em;color:#888;padding:6px 8px;border-bottom:1px solid #ddd;text-align:left}td{padding:8px;border-bottom:1px solid #eee;vertical-align:top}.totals{margin-top:24px;margin-left:auto;width:280px}.tot-row{display:flex;justify-content:space-between;padding:6px 0;font-size:11px;border-bottom:1px solid #eee}.tot-grand{display:flex;justify-content:space-between;padding:10px 0;font-size:14px;font-weight:700;border-top:2px solid #111;margin-top:4px}.foot{margin-top:32px;font-size:9px;color:#aaa;border-top:1px solid #eee;padding-top:10px}</style></head><body onload="window.print();window.onafterprint=()=>window.close()"><div class="header"><div class="co">Autogalerie Jülich</div><div class="meta">Werkstattauftrag<br>${new Date().toLocaleDateString("de-DE")}</div></div><h1>${esc(title)}</h1><div class="sub">${activeVehicle?.fin ? `FIN ${esc(activeVehicle.fin)} · ` : ""}${marks.length} Karosserieposition(en) · ${mechanicalTasks.length} Mechanikaufgabe(n)</div><h2>Karosserie / Lack</h2><table><thead><tr><th>#</th><th>Art</th><th>Bauteil</th><th>Maßnahme</th><th>Notiz</th><th style="text-align:right">Preis</th></tr></thead><tbody>${bodyRows || '<tr><td colspan="6" style="color:#aaa;padding:12px 8px">Keine Positionen</td></tr>'}</tbody></table><h2>Mechanik</h2><table><thead><tr><th>#</th><th>Bereich</th><th>Arbeit</th><th>Notiz</th><th>Status</th><th style="text-align:right">Preis</th></tr></thead><tbody>${mechRows || '<tr><td colspan="6" style="color:#aaa;padding:12px 8px">Keine Aufgaben</td></tr>'}</tbody></table><div class="totals"><div class="tot-row"><span>Karosserie / Lack</span><span>${formatEuro(bodyworkTotal)}</span></div><div class="tot-row"><span>Mechanik</span><span>${formatEuro(mechanicalTotal)}</span></div><div class="tot-grand"><span>Gesamt</span><span>${formatEuro(workshopTotal)}</span></div></div><div class="foot">Nur für internen Gebrauch · Autogalerie Jülich</div></body></html>`,
    );
    w.document.close();
    w.focus();
  };

  const handleBillingRangePrint = ({ from, to }) => {
    const start = from ? new Date(`${from}T00:00:00`) : null;
    const end = to ? new Date(`${to}T23:59:59`) : null;

    const rows = vehicles
      .filter((vehicle) => {
        const createdAt = new Date(vehicle.createdAt || Date.now());

        if (start && createdAt < start) return false;
        if (end && createdAt > end) return false;

        return true;
      })
      .map((vehicle) => {
        const brand = BRANDS.find((item) => item.id === vehicle.brandId);
        const bodywork = marksByVehicle[vehicle.id] || [];
        const mechanical = mechanicalByVehicle[vehicle.id] || [];

        const bodyworkTotal = bodywork.reduce(
          (sum, item) => sum + parsePrice(item.price),
          0,
        );

        const mechanicalTotal = mechanical.reduce(
          (sum, item) => sum + parsePrice(item.price),
          0,
        );

        return {
          vehicle,
          brand: brand?.label || "",
          bodywork,
          mechanical,
          bodyworkTotal,
          mechanicalTotal,
          total: bodyworkTotal + mechanicalTotal,
        };
      })
      .filter((row) => row.bodywork.length > 0 || row.mechanical.length > 0);

    if (!rows.length) {
      toast.error("Keine Abrechnungen im Zeitraum.");
      return;
    }

    const printWindow = window.open("", "_blank", "width=1100,height=1200");

    if (!printWindow) {
      toast.error("Popup blockiert.");
      return;
    }

    const escapeHtml = (value) =>
      String(value ?? "").replace(
        /[&<>"']/g,
        (character) =>
          ({
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;",
          })[character],
      );

    const bodyworkGrandTotal = rows.reduce(
      (sum, row) => sum + row.bodyworkTotal,
      0,
    );

    const mechanicalGrandTotal = rows.reduce(
      (sum, row) => sum + row.mechanicalTotal,
      0,
    );

    const grandTotal = bodyworkGrandTotal + mechanicalGrandTotal;

    const vehicleSections = rows
      .map((row, vehicleIndex) => {
        const vehicleName = `${row.brand} ${row.vehicle.name}`.trim();

        const bodyworkRows = row.bodywork
          .map((task, index) => {
            const damageType = DAMAGE_TYPES.find(
              (item) => item.id === task.type,
            );

            return `
              <tr>
                <td class="position">${index + 1}</td>
                <td><span class="type type-body">Karosserie</span></td>
                <td>
                  <div class="task-title">${escapeHtml(
                    task.action || damageType?.label || "Karosseriearbeit",
                  )}</div>
                  <div class="task-meta">${escapeHtml(
                    damageType?.label || "Schaden",
                  )}</div>
                </td>
                <td>${escapeHtml(task.panel || damageType?.label || "—")}</td>
                <td class="note">${escapeHtml(task.note || "—")}</td>
                <td class="number">${formatEuro(task.price)}</td>
              </tr>
            `;
          })
          .join("");

        const mechanicalRows = row.mechanical
          .map(
            (task, index) => `
              <tr>
                <td class="position">${row.bodywork.length + index + 1}</td>
                <td><span class="type type-mechanical">Mechanik</span></td>
                <td>
                  <div class="task-title">${escapeHtml(task.job || "—")}</div>
                  <div class="task-meta">${
                    task.done ? "Erledigt" : "Offen"
                  }</div>
                </td>
                <td>${escapeHtml(task.area || "Ohne Bereich")}</td>
                <td class="note">${escapeHtml(task.note || "—")}</td>
                <td class="number">${formatEuro(task.price)}</td>
              </tr>
            `,
          )
          .join("");

        return `
          <section class="vehicle-section ${
            vehicleIndex > 0 ? "vehicle-break" : ""
          }">
            <div class="vehicle-header">
              <div>
                <h2>${escapeHtml(vehicleName || "Fahrzeug")}</h2>
                <div class="vehicle-meta">
                  ${
                    row.vehicle.fin
                      ? `FIN ${escapeHtml(row.vehicle.fin)} · `
                      : ""
                  }
                  Angelegt am ${formatDate(row.vehicle.createdAt)}
                </div>
              </div>

              <div class="vehicle-total">
                <span>Fahrzeug gesamt</span>
                <strong>${formatEuro(row.total)}</strong>
              </div>
            </div>

            <table>
              <thead>
                <tr>
                  <th class="position">Pos.</th>
                  <th>Typ</th>
                  <th>Aufgabe / Leistung</th>
                  <th>Bereich / Bauteil</th>
                  <th>Notiz</th>
                  <th class="number">Preis</th>
                </tr>
              </thead>

              <tbody>
                ${
                  bodyworkRows || mechanicalRows
                    ? `${bodyworkRows}${mechanicalRows}`
                    : '<tr><td colspan="6" class="empty">Keine Aufgaben</td></tr>'
                }
              </tbody>
            </table>

            <div class="vehicle-summary">
              <div>
                <span>Karosserie</span>
                <strong>${formatEuro(row.bodyworkTotal)}</strong>
              </div>
              <div>
                <span>Mechanik</span>
                <strong>${formatEuro(row.mechanicalTotal)}</strong>
              </div>
              <div class="vehicle-summary-total">
                <span>Gesamt</span>
                <strong>${formatEuro(row.total)}</strong>
              </div>
            </div>
          </section>
        `;
      })
      .join("");

    printWindow.document.write(`
      <!doctype html>
      <html lang="de">
        <head>
          <meta charset="utf-8" />
          <title>Werkstatt-Abrechnungen</title>

          <style>
            * {
              box-sizing: border-box;
              margin: 0;
              padding: 0;
            }

            body {
              background: #ffffff;
              color: #111111;
              font-family:
                -apple-system,
                BlinkMacSystemFont,
                "Segoe UI",
                sans-serif;
              font-size: 11px;
              padding: 30px;
            }

            .document-header {
              align-items: flex-end;
              border-bottom: 2px solid #111111;
              display: flex;
              justify-content: space-between;
              margin-bottom: 24px;
              padding-bottom: 15px;
            }

            .company {
              font-size: 16px;
              font-weight: 700;
            }

            .document-meta {
              color: #666666;
              font-size: 10px;
              text-align: right;
            }

            h1 {
              font-size: 21px;
              font-weight: 650;
              margin-bottom: 4px;
            }

            .range {
              color: #666666;
              font-size: 11px;
              margin-bottom: 24px;
            }

            .vehicle-section {
              border: 1px solid #dcdcdc;
              border-radius: 5px;
              margin-bottom: 22px;
              overflow: hidden;
            }

            .vehicle-header {
              align-items: center;
              background: #f5f5f5;
              border-bottom: 1px solid #dcdcdc;
              display: flex;
              justify-content: space-between;
              padding: 12px 14px;
            }

            .vehicle-header h2 {
              font-size: 14px;
              font-weight: 650;
              margin-bottom: 2px;
            }

            .vehicle-meta {
              color: #777777;
              font-size: 9.5px;
            }

            .vehicle-total {
              align-items: flex-end;
              display: flex;
              flex-direction: column;
              gap: 2px;
            }

            .vehicle-total span {
              color: #777777;
              font-size: 9px;
              text-transform: uppercase;
            }

            .vehicle-total strong {
              font-size: 14px;
            }

            table {
              border-collapse: collapse;
              width: 100%;
            }

            th {
              background: #fafafa;
              border-bottom: 1px solid #dddddd;
              color: #777777;
              font-size: 8.5px;
              font-weight: 650;
              letter-spacing: 0.05em;
              padding: 7px 8px;
              text-align: left;
              text-transform: uppercase;
            }

            td {
              border-bottom: 1px solid #eeeeee;
              padding: 8px;
              vertical-align: top;
            }

            tbody tr:last-child td {
              border-bottom: 0;
            }

            .position {
              text-align: center;
              width: 42px;
            }

            .number {
              text-align: right;
              white-space: nowrap;
            }

            .task-title {
              font-weight: 600;
            }

            .task-meta {
              color: #999999;
              font-size: 9px;
              margin-top: 2px;
            }

            .note {
              color: #666666;
              max-width: 210px;
              overflow-wrap: anywhere;
            }

            .type {
              border-radius: 3px;
              display: inline-block;
              font-size: 8px;
              font-weight: 700;
              letter-spacing: 0.04em;
              padding: 3px 5px;
              text-transform: uppercase;
            }

            .type-body {
              background: #eef4ff;
              color: #285eaa;
            }

            .type-mechanical {
              background: #fff5e7;
              color: #a35d00;
            }

            .empty {
              color: #999999;
              padding: 14px;
              text-align: center;
            }

            .vehicle-summary {
              border-top: 1px solid #dddddd;
              display: flex;
              justify-content: flex-end;
              padding: 8px 14px;
            }

            .vehicle-summary > div {
              display: flex;
              gap: 14px;
              justify-content: space-between;
              min-width: 155px;
              padding: 4px 10px;
            }

            .vehicle-summary span {
              color: #777777;
            }

            .vehicle-summary-total {
              border-left: 1px solid #dddddd;
              font-size: 11.5px;
            }

            .grand-summary {
              margin-left: auto;
              margin-top: 26px;
              width: 310px;
            }

            .grand-row {
              border-bottom: 1px solid #eeeeee;
              display: flex;
              justify-content: space-between;
              padding: 7px 0;
            }

            .grand-total {
              border-top: 2px solid #111111;
              font-size: 15px;
              font-weight: 700;
              margin-top: 4px;
              padding-top: 10px;
            }

            .footer {
              border-top: 1px solid #eeeeee;
              color: #aaaaaa;
              font-size: 9px;
              margin-top: 34px;
              padding-top: 10px;
            }

            @media print {
              body {
                padding: 18px;
              }

              .vehicle-section {
                break-inside: avoid;
              }
            }
          </style>
        </head>

        <body onload="window.print(); window.onafterprint = () => window.close();">
          <div class="document-header">
            <div class="company">Autogalerie Jülich</div>
            <div class="document-meta">
              Werkstatt-Abrechnungsübersicht<br />
              ${new Date().toLocaleDateString("de-DE")}
            </div>
          </div>

          <h1>Werkstatt-Abrechnungen</h1>

          <div class="range">
            Zeitraum:
            ${from ? formatDate(from) : "Beginn"}
            –
            ${to ? formatDate(to) : "Heute"}
            ·
            ${rows.length} Fahrzeug(e)
          </div>

          ${vehicleSections}

          <div class="grand-summary">
            <div class="grand-row">
              <span>Karosserie gesamt</span>
              <strong>${formatEuro(bodyworkGrandTotal)}</strong>
            </div>

            <div class="grand-row">
              <span>Mechanik gesamt</span>
              <strong>${formatEuro(mechanicalGrandTotal)}</strong>
            </div>

            <div class="grand-row grand-total">
              <span>Gesamtsumme</span>
              <strong>${formatEuro(grandTotal)}</strong>
            </div>
          </div>

          <div class="footer">
            Autogalerie Jülich · Nur für internen Gebrauch
          </div>
        </body>
      </html>
    `);

    printWindow.document.close();
    printWindow.focus();
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
    <div
      className="min-h-screen bg-[#f0f0f0] text-[#1a1a1a]"
      style={{
        fontFamily:
          "-apple-system,BlinkMacSystemFont,'Segoe UI','SF Pro Text',system-ui,sans-serif",
      }}
    >
      {/* ── Title bar ── */}
      <div
        className="bg-[#e8e8e8] border-b border-[#c8c8c8]"
        style={{ boxShadow: "0 1px 0 rgba(255,255,255,0.6) inset" }}
      >
        <div className="mx-auto max-w-[1720px] px-4 sm:px-6">
          <div className="flex min-h-11 items-center justify-between gap-2 py-2 sm:gap-4">
            <div className="flex min-w-0 items-center gap-2 sm:gap-3">
              <button
                onClick={() => setMobileTreeOpen(true)}
                className="grid h-8 w-8 flex-none place-items-center rounded border border-[#c8c8c8] bg-white text-[#333] shadow-sm lg:hidden"
                aria-label="Fahrzeugordner öffnen"
              >
                <FiMenu size={15} />
              </button>
              <div className="flex items-center gap-1.5 text-[13px] font-medium text-[#1a1a1a]">
                <FiTarget size={14} className="text-[#555]" />
                <span className="hidden sm:inline">
                  Werkstatt-Inspektion 3D
                </span>
                <span className="sm:hidden">Werkstatt</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="hidden items-center gap-1.5 md:flex">
                <SysButton
                  onClick={() => setShowBillingPrint(true)}
                  icon={<FiFileText size={12} />}
                  label="Abrechnungen"
                />
                <SysButton
                  onClick={handlePrint}
                  disabled={!activeVehicle}
                  icon={<FiPrinter size={12} />}
                  label="Drucken"
                />
              </div>
              {activeVehicle && (
                <button
                  onClick={() =>
                    handleStatusChange(
                      activeVehicle.id,
                      activeVehicle.status === "completed"
                        ? "in_progress"
                        : "completed",
                    )
                  }
                  disabled={saving}
                  className={`inline-flex h-7 items-center cursor-pointer gap-1.5 rounded  border px-2 text-[10px] font-semibold sm:px-2.5 sm:text-[11px] ${
                    activeVehicle.status === "completed"
                      ? "border-[#86b996] bg-[#edf8f0] text-[#25633a]"
                      : "border-[#7fa8dd] bg-[#eef5ff] text-[#2f63a8]"
                  }`}
                >
                  <FiCheckCircle size={12} />
                  <span className="hidden sm:inline">
                    {activeVehicle.status === "completed"
                      ? "Wieder öffnen"
                      : "Abschließen"}
                  </span>
                </button>
              )}
              <SysPrimaryButton
                onClick={handleSave}
                disabled={!activeVehicle || saving}
                icon={<FiSave size={12} />}
                label={saving ? "Speichert…" : "Speichern"}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1720px] px-2 py-2 sm:px-6 sm:py-4">
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-[220px_minmax(0,1fr)_316px]">
          {/* ── LEFT: Vehicle Tree ── */}
          <div className="hidden lg:block">
            <VehicleTree
              brands={BRANDS}
              vehicles={vehicles}
              activeVehicleId={activeVehicleId}
              onSelect={setActiveVehicleId}
              onAdd={() => setShowAdd(true)}
              onDeleteVehicle={deleteVehicle}
              onStatusChange={handleStatusChange}
              marksByVehicle={marksByVehicle}
              mechanicalByVehicle={mechanicalByVehicle}
            />
          </div>

          {/* ── CENTER ── */}
          <div className="flex flex-col gap-3">
            {activeVehicle && (
              <SysCard className="md:hidden">
                <div className="flex items-center justify-between">
                  <SectionHeader
                    icon={<FiClipboard size={12} />}
                    title={`Aufgaben (${marks.length + mechanicalTasks.length})`}
                  />
                  {(marks.length > 0 || mechanicalTasks.length > 0) && (
                    <button
                      onClick={clearAllAufgaben}
                      className="text-[10px] text-[#cc3333] hover:underline"
                    >
                      Alle löschen
                    </button>
                  )}
                </div>
                {marks.length === 0 && mechanicalTasks.length === 0 ? (
                  <p className="mt-3 text-[11px] text-[#aaa]">
                    Noch keine Aufgaben vorhanden.
                  </p>
                ) : (
                  <ul className="mt-2 max-h-64 overflow-auto divide-y divide-[#ebebeb]">
                    {marks.map((mark, index) => {
                      const type = DAMAGE_TYPES.find(
                        (item) => item.id === mark.type,
                      );

                      return (
                        <li
                          key={mark.id}
                          onClick={() => selectMark(mark.id)}
                          className={`flex cursor-pointer items-start gap-2 rounded px-1 py-2 text-[11px] ${
                            selectedMark === mark.id
                              ? "bg-[#e8eef8]"
                              : "hover:bg-[#f5f5f5]"
                          }`}
                        >
                          <span
                            className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded-full text-[9px] font-bold text-white"
                            style={{ background: type?.color }}
                          >
                            {index + 1}
                          </span>

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate font-medium ${
                                mark.done
                                  ? "text-[#aaa] line-through"
                                  : "text-[#1a1a1a]"
                              }`}
                            >
                              {mark.action || type?.label}
                            </span>

                            {mark.note && (
                              <span className="mt-0.5 block truncate text-[9.5px] text-[#9a9a9a]">
                                Notiz: {mark.note}
                              </span>
                            )}
                          </span>

                          <div className="mt-0.5 flex flex-none items-center gap-1">
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                updateMark(mark.id, { done: !mark.done });
                              }}
                              className={`grid h-5 w-5 place-items-center rounded border text-[9px] transition ${
                                mark.done
                                  ? "border-[#22aa55] bg-[#22aa55] text-white"
                                  : "border-[#cfcfcf] bg-white text-transparent hover:border-[#22aa55]"
                              }`}
                              aria-label={
                                mark.done
                                  ? "Lackieraufgabe wieder öffnen"
                                  : "Lackieraufgabe erledigen"
                              }
                              title={
                                mark.done
                                  ? "Als offen markieren"
                                  : "Als erledigt markieren"
                              }
                            >
                              ✓
                            </button>

                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                deleteMark(mark.id);
                              }}
                              className="grid h-5 w-5 place-items-center rounded text-[#c4c4c4] transition hover:bg-[#fdecec] hover:text-[#cc3333]"
                              aria-label="Karosserieaufgabe löschen"
                              title="Aufgabe löschen"
                            >
                              <FiX size={12} />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                    {mechanicalTasks.map((task) => (
                      <li
                        key={task.id}
                        className="flex items-start gap-2 rounded px-1 py-2 text-[11px]"
                      >
                        <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded bg-[#eef2ff] text-[#4f46e5]">
                          <FiTool size={11} />
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={`block truncate font-medium ${
                              task.done
                                ? "text-[#aaa] line-through"
                                : "text-[#1a1a1a]"
                            }`}
                          >
                            {task.job}
                          </span>

                          {task.area && (
                            <span className="block truncate text-[10px] text-[#888]">
                              {task.area}
                            </span>
                          )}

                          {task.note && (
                            <span className="mt-0.5 block truncate text-[9.5px] text-[#9a9a9a]">
                              Notiz: {task.note}
                            </span>
                          )}
                        </span>

                        <div className="mt-0.5 flex flex-none items-center gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              updateMechanicalTask(task.id, {
                                done: !task.done,
                              })
                            }
                            className={`grid h-5 w-5 place-items-center rounded border text-[9px] transition ${
                              task.done
                                ? "border-[#22aa55] bg-[#22aa55] text-white"
                                : "border-[#cfcfcf] bg-white text-transparent hover:border-[#22aa55]"
                            }`}
                            aria-label={
                              task.done
                                ? "Mechanikaufgabe wieder öffnen"
                                : "Mechanikaufgabe erledigen"
                            }
                            title={
                              task.done
                                ? "Als offen markieren"
                                : "Als erledigt markieren"
                            }
                          >
                            ✓
                          </button>

                          <button
                            type="button"
                            onClick={() => removeMechanicalTask(task.id)}
                            className="grid h-5 w-5 place-items-center rounded text-[#c4c4c4] transition hover:bg-[#fdecec] hover:text-[#cc3333]"
                            aria-label="Mechanische Aufgabe löschen"
                            title="Aufgabe löschen"
                          >
                            <FiX size={12} />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </SysCard>
            )}

            {/* 3D Viewer */}
            <SysCard noPad>
              <div
                ref={mountRef}
                className="relative w-full touch-none"
                style={{
                  aspectRatio: "16/10",
                  background: "linear-gradient(160deg,#f7f7f8 0%,#ebebed 100%)",
                  cursor: placing ? "crosshair" : "grab",
                }}
              >
                {dataLoading && (
                  <div className="absolute inset-0 z-20 grid place-items-center bg-white/70">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ddd] border-t-[#1a1a1a]" />
                      <span className="text-[11px] text-[#888]">
                        Daten werden geladen
                      </span>
                    </div>
                  </div>
                )}
                {!activeVehicle && !dataLoading && sceneReady && !errored && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="flex flex-col items-center gap-3 text-center">
                      <FiTruck size={28} className="text-[#bbb]" />
                      <p className="text-[12px] text-[#888] max-w-[200px]">
                        Kein Fahrzeug ausgewählt. Wähle links ein Fahrzeug oder
                        lege eines an.
                      </p>
                      <button
                        onClick={() => setShowAdd(true)}
                        className="inline-flex items-center gap-1.5 rounded bg-[#1a1a1a] px-3 py-1.5 text-[11px] font-medium text-white hover:bg-[#333]"
                      >
                        <FiPlusCircle size={12} /> Fahrzeug anlegen
                      </button>
                    </div>
                  </div>
                )}
                {activeVehicle && ready !== true && !errored && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="flex flex-col items-center gap-2">
                      <div className="h-5 w-5 animate-spin rounded-full border-2 border-[#ddd] border-t-[#1a1a1a]" />
                      <span className="text-[11px] text-[#888]">
                        {loadingMsg}
                      </span>
                    </div>
                  </div>
                )}
                {errored && (
                  <div className="absolute inset-0 grid place-items-center">
                    <div className="flex flex-col items-center gap-2 text-center">
                      <FiAlertCircle className="text-[#cc3333]" size={20} />
                      <p className="text-[11px] text-[#888] max-w-[200px]">
                        {loadingMsg}
                      </p>
                    </div>
                  </div>
                )}
                {ready === true && activeVehicle && (
                  <>
                    {/* Status chips */}
                    <div className="pointer-events-none absolute left-3 top-3 flex items-center gap-1.5">
                      <span
                        className={`inline-flex items-center gap-1 rounded px-2 py-1 text-[10px] font-medium border ${placing ? "bg-[#1a1a1a] text-white border-[#1a1a1a]" : "bg-white/90 text-[#555] border-[#d0d0d0]"}`}
                      >
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${placing ? "bg-white" : "bg-[#aaa]"}`}
                        />
                        {placing ? "Markier-Modus" : "Nur Ansicht"}
                      </span>
                    </div>
                    {/* Viewer controls */}
                    <div className="absolute right-3 top-3 flex flex-col gap-1">
                      <ViewerIconBtn
                        onClick={() => setAutoSpin((s) => !s)}
                        active={autoSpin}
                        title="Auto-Rotation"
                      >
                        <FiRotateCw
                          size={13}
                          className={autoSpin ? "animate-spin" : ""}
                        />
                      </ViewerIconBtn>
                      <ViewerIconBtn
                        onClick={() => setPlacing((p) => !p)}
                        active={placing}
                        title="Markier-Modus"
                      >
                        <FiCrosshair size={13} />
                      </ViewerIconBtn>
                      <ViewerIconBtn
                        onClick={resetView}
                        title="Ansicht zurücksetzen"
                      >
                        <FiMaximize size={13} />
                      </ViewerIconBtn>
                    </div>
                  </>
                )}
              </div>
            </SysCard>

            {/* Vehicle details + task list */}
            {activeVehicle && (
              <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
                <SysCard>
                  <SectionHeader
                    icon={<FiTruck size={12} />}
                    title="Fahrzeugdetails"
                  />
                  <table className="w-full text-[11px] mt-2">
                    <tbody>
                      {[
                        ["Marke", activeBrand?.label || "—"],
                        ["Bezeichnung", activeVehicle.name || "—"],
                        ["FIN", activeVehicle.fin || "—", true],
                        ["Angelegt", formatDate(activeVehicle.createdAt)],
                        ["Karosserie", `${marks.length} Position(en)`],
                        ["Mechanik", `${mechanicalTasks.length} Aufgabe(n)`],
                        [
                          "Fotos vorher",
                          `${beforeRepairPhotos.length} Foto(s)`,
                        ],
                      ].map(([l, v, mono]) => (
                        <tr
                          key={l}
                          className="border-b border-[#ebebeb] last:border-0"
                        >
                          <td className="py-1.5 pr-4 text-[#888] w-36">{l}</td>
                          <td
                            className={`py-1.5 text-[#1a1a1a] font-medium ${mono ? "font-mono text-[10.5px]" : ""}`}
                          >
                            {v}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </SysCard>

                <SysCard className="hidden md:block">
                  <div className="flex items-center justify-between">
                    <SectionHeader
                      icon={<FiClipboard size={12} />}
                      title={`Aufgaben (${marks.length + mechanicalTasks.length})`}
                    />
                    {(marks.length > 0 || mechanicalTasks.length > 0) && (
                      <button
                        onClick={clearAllAufgaben}
                        className="text-[10px] text-[#cc3333] hover:underline"
                      >
                        Alle löschen
                      </button>
                    )}
                  </div>
                  {marks.length === 0 && mechanicalTasks.length === 0 ? (
                    <p className="mt-3 text-[11px] text-[#aaa]">
                      Noch keine Aufgaben vorhanden.
                    </p>
                  ) : (
                    <ul className="mt-2 max-h-56 overflow-auto divide-y divide-[#ebebeb]">
                      {marks.map((mark, i) => {
                        const tp = DAMAGE_TYPES.find((t) => t.id === mark.type);

                        return (
                          <li
                            key={mark.id}
                            onClick={() => selectMark(mark.id)}
                            className={`flex cursor-pointer items-start gap-2 rounded px-1 py-2 text-[11px] ${
                              selectedMark === mark.id
                                ? "bg-[#e8eef8]"
                                : "hover:bg-[#f5f5f5]"
                            }`}
                          >
                            <span
                              className="mt-0.5 grid h-4 w-4 flex-none place-items-center rounded-full text-[9px] font-bold text-white"
                              style={{ background: tp?.color }}
                            >
                              {i + 1}
                            </span>

                            <span className="min-w-0 flex-1">
                              <span
                                className={`block truncate font-medium ${
                                  mark.done
                                    ? "text-[#aaa] line-through"
                                    : "text-[#1a1a1a]"
                                }`}
                              >
                                {mark.action || tp?.label}
                              </span>

                              {mark.note && (
                                <span className="mt-0.5 block truncate text-[9px] text-[#9a9a9a]">
                                  Notiz: {mark.note}
                                </span>
                              )}
                            </span>

                            <div className="mt-0.5 flex flex-none items-center gap-1">
                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  updateMark(mark.id, { done: !mark.done });
                                }}
                                className={`grid h-5 w-5 place-items-center rounded border text-[9px] transition ${
                                  mark.done
                                    ? "border-[#22aa55] bg-[#22aa55] text-white"
                                    : "border-[#cfcfcf] bg-white text-transparent hover:border-[#22aa55]"
                                }`}
                                aria-label={
                                  mark.done
                                    ? "Lackieraufgabe wieder öffnen"
                                    : "Lackieraufgabe erledigen"
                                }
                                title={
                                  mark.done
                                    ? "Als offen markieren"
                                    : "Als erledigt markieren"
                                }
                              >
                                ✓
                              </button>

                              <button
                                type="button"
                                onClick={(event) => {
                                  event.stopPropagation();
                                  deleteMark(mark.id);
                                }}
                                className="grid h-5 w-5 place-items-center rounded text-[#c4c4c4] transition hover:bg-[#fdecec] hover:text-[#cc3333]"
                                aria-label="Karosserieaufgabe löschen"
                                title="Aufgabe löschen"
                              >
                                <FiX size={11} />
                              </button>
                            </div>
                          </li>
                        );
                      })}
                      {mechanicalTasks.map((task) => (
                        <li
                          key={task.id}
                          className="flex items-start gap-2 rounded px-1 py-2 text-[11px]"
                        >
                          <span className="mt-0.5 grid h-5 w-5 flex-none place-items-center rounded bg-[#eef2ff] text-[#4f46e5]">
                            <FiTool size={11} />
                          </span>

                          <span className="min-w-0 flex-1">
                            <span
                              className={`block truncate font-medium ${
                                task.done
                                  ? "text-[#aaa] line-through"
                                  : "text-[#1a1a1a]"
                              }`}
                            >
                              {task.job}
                            </span>

                            {task.area && (
                              <span className="block truncate text-[10px] text-[#888]">
                                {task.area}
                              </span>
                            )}

                            {task.note && (
                              <span className="mt-0.5 block truncate text-[9px] text-[#9a9a9a]">
                                Notiz: {task.note}
                              </span>
                            )}
                          </span>

                          <div className="mt-0.5 flex flex-none items-center gap-1">
                            <button
                              type="button"
                              onClick={() =>
                                updateMechanicalTask(task.id, {
                                  done: !task.done,
                                })
                              }
                              className={`grid h-5 w-5 place-items-center rounded border text-[9px] transition ${
                                task.done
                                  ? "border-[#22aa55] bg-[#22aa55] text-white"
                                  : "border-[#cfcfcf] bg-white text-transparent hover:border-[#22aa55]"
                              }`}
                              aria-label={
                                task.done
                                  ? "Mechanikaufgabe wieder öffnen"
                                  : "Mechanikaufgabe erledigen"
                              }
                              title={
                                task.done
                                  ? "Als offen markieren"
                                  : "Als erledigt markieren"
                              }
                            >
                              ✓
                            </button>

                            <button
                              type="button"
                              onClick={() => removeMechanicalTask(task.id)}
                              className="grid h-5 w-5 place-items-center rounded text-[#c4c4c4] transition hover:bg-[#fdecec] hover:text-[#cc3333]"
                              aria-label="Mechanische Aufgabe löschen"
                              title="Aufgabe löschen"
                            >
                              <FiX size={11} />
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </SysCard>
              </div>
            )}

            {activeVehicle && (
              <BeforeRepairPhotos
                photos={beforeRepairPhotos}
                uploading={uploadingPhotos}
                inputRef={photoInputRef}
                onSelectFiles={handlePhotoSelection}
                onDelete={deleteBeforeRepairPhoto}
              />
            )}

            {/* Billing */}
            {activeVehicle && (
              <SysCard noPad className="hidden md:block">
                <div className="flex items-center justify-between px-4 py-3 border-b border-[#e0e0e0]">
                  <div className="flex items-center gap-2">
                    <FiDollarSign size={13} className="text-[#555]" />
                    <span className="text-[12px] font-semibold text-[#1a1a1a]">
                      Abrechnung
                    </span>
                  </div>
                  <span className="text-[11px] text-[#888]">
                    {marks.length + mechanicalTasks.length} Position(en)
                  </span>
                </div>
                <div className="grid grid-cols-1 xl:grid-cols-[1fr_240px]">
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[600px] text-[11px]">
                      <thead>
                        <tr className="bg-[#f5f5f5] border-b border-[#e0e0e0]">
                          {[
                            "Pos.",
                            "Typ",
                            "Leistung",
                            "Bauteil / Bereich",
                            "Preis",
                          ].map((h, i) => (
                            <th
                              key={h}
                              className={`px-3 py-2 text-[9px] font-semibold uppercase tracking-[.08em] text-[#888] text-left ${i === 4 ? "text-right" : ""}`}
                            >
                              {h}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#ebebeb]">
                        {marks.map((m, i) => {
                          const tp = DAMAGE_TYPES.find((t) => t.id === m.type);
                          return (
                            <tr key={m.id} className="hover:bg-[#fafafa]">
                              <td className="px-3 py-2 text-[#888] tabular-nums w-10">
                                {String(i + 1).padStart(2, "0")}
                              </td>
                              <td className="px-3 py-2">
                                <span
                                  className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide"
                                  style={{
                                    background: tp?.color + "18",
                                    color: tp?.color,
                                  }}
                                >
                                  <span
                                    className="h-1.5 w-1.5 rounded-full"
                                    style={{ background: tp?.color }}
                                  />
                                  Karosserie
                                </span>
                              </td>
                              <td className="px-3 py-2">
                                <p className="font-medium text-[#1a1a1a]">
                                  {m.action || tp?.label}
                                </p>
                                {m.note && (
                                  <p className="text-[#aaa] text-[9.5px] truncate max-w-[240px]">
                                    {m.note}
                                  </p>
                                )}
                              </td>
                              <td className="px-3 py-2 text-[#888]">
                                {m.panel || tp?.label || "—"}
                              </td>
                              <td className="px-3 py-1.5 text-right">
                                <MoneyInput
                                  value={m.price || ""}
                                  onChange={(v) =>
                                    updateMark(m.id, { price: v })
                                  }
                                />
                              </td>
                            </tr>
                          );
                        })}
                        {mechanicalTasks.map((task, i) => (
                          <tr key={task.id} className="hover:bg-[#fafafa]">
                            <td className="px-3 py-2 text-[#888] tabular-nums">
                              {String(marks.length + i + 1).padStart(2, "0")}
                            </td>
                            <td className="px-3 py-2">
                              <span className="inline-flex items-center gap-1 rounded px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide bg-[#fef3c7] text-[#92400e]">
                                <FiTool size={9} /> Mechanik
                              </span>
                            </td>
                            <td className="px-3 py-2">
                              <p className="font-medium text-[#1a1a1a]">
                                {task.job}
                              </p>
                              {task.note && (
                                <p className="text-[#aaa] text-[9.5px] truncate max-w-[240px]">
                                  {task.note}
                                </p>
                              )}
                            </td>
                            <td className="px-3 py-2 text-[#888]">
                              {task.area || "—"}
                            </td>
                            <td className="px-3 py-1.5 text-right">
                              <MoneyInput
                                value={task.price || ""}
                                onChange={(v) =>
                                  updateMechanicalTask(task.id, { price: v })
                                }
                              />
                            </td>
                          </tr>
                        ))}
                        {marks.length === 0 && mechanicalTasks.length === 0 && (
                          <tr>
                            <td
                              colSpan={5}
                              className="px-4 py-8 text-center text-[11px] text-[#bbb]"
                            >
                              Keine abrechenbaren Positionen vorhanden
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                  {/* Summary sidebar */}
                  <div className="border-t border-[#e0e0e0] xl:border-l xl:border-t-0 bg-[#fafafa] p-4 flex flex-col justify-between">
                    <div>
                      <p className="text-[9px] font-semibold uppercase tracking-[.1em] text-[#aaa] mb-3">
                        Kostenübersicht
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#888]">
                            Karosserie / Lack ({marks.length})
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatEuro(bodyworkTotal)}
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px]">
                          <span className="text-[#888]">
                            Mechanik ({mechanicalTasks.length})
                          </span>
                          <span className="font-medium tabular-nums">
                            {formatEuro(mechanicalTotal)}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="border-t border-[#e0e0e0] pt-3 mt-3">
                      <div className="flex items-end justify-between">
                        <p className="text-[10px] text-[#888]">Gesamtbetrag</p>
                        <p className="text-[18px] font-semibold tabular-nums text-[#1a1a1a]">
                          {formatEuro(workshopTotal)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </SysCard>
            )}
          </div>

          {/* ── RIGHT SIDEBAR ── */}
          <aside className="flex flex-col gap-3">
            {/* Damage type selector */}
            <SysCard>
              <SectionHeader title="Schadensart" />
              <div className="mt-2 grid grid-cols-2 gap-1">
                {DAMAGE_TYPES.map((tp) => {
                  const on = activeType === tp.id;
                  const n = counts.find((c) => c.id === tp.id)?.n || 0;
                  return (
                    <button
                      key={tp.id}
                      onClick={() => setActiveType(tp.id)}
                      className={`flex items-center justify-between gap-2 rounded border px-2.5 py-1.5 text-[11px] font-medium text-left transition-all ${on ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#d8d8d8] bg-white text-[#333] hover:border-[#bbb] hover:bg-[#f5f5f5]"}`}
                    >
                      <span className="flex items-center gap-1.5">
                        <span
                          className="h-2 w-2 rounded-full flex-none"
                          style={{ background: on ? "#fff" : tp.color }}
                        />
                        {tp.label}
                      </span>
                      {n > 0 && (
                        <span
                          className={`text-[9px] tabular-nums rounded px-1 ${on ? "bg-white/20" : "bg-[#eee] text-[#888]"}`}
                        >
                          {n}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </SysCard>

            {/* Mark editor */}
            {selected ? (
              <SysCard>
                <div className="flex items-center justify-between">
                  <SectionHeader
                    title={`Position ${marks.findIndex((m) => m.id === selected.id) + 1} bearbeiten`}
                  />
                  <button
                    onClick={() => setSelectedMark(null)}
                    className="text-[#aaa] hover:text-[#555]"
                  >
                    <FiX size={13} />
                  </button>
                </div>
                <div className="mt-2 space-y-2.5">
                  <SysField label="Maßnahme">
                    <SysSelect
                      value={selected.action}
                      onChange={(v) => updateMark(selected.id, { action: v })}
                      options={BODYWORK_ACTIONS}
                    />
                  </SysField>
                  <SysField label="Bauteil">
                    <SysSelect
                      value={selected.panel}
                      onChange={(v) => updateMark(selected.id, { panel: v })}
                      options={["", ...PANELS]}
                      placeholder="Wählen (optional)"
                    />
                  </SysField>
                  <SysField label="Notiz">
                    <textarea
                      value={selected.note}
                      onChange={(e) =>
                        updateMark(selected.id, { note: e.target.value })
                      }
                      rows={3}
                      placeholder="z. B. tiefer Kratzer, Kante beachten …"
                      className="w-full rounded border border-[#d0d0d0] bg-white px-2.5 py-1.5 text-[11px] text-[#1a1a1a] outline-none focus:border-[#555] focus:ring-1 focus:ring-[#555]/20 resize-none"
                    />
                  </SysField>
                  <div className="flex items-center justify-between pt-1 border-t border-[#ebebeb]">
                    <button
                      onClick={() => flyToMark(selected)}
                      className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#3366cc] hover:underline"
                    >
                      <FiTarget size={11} /> Zu Position springen
                    </button>
                    <button
                      onClick={() => deleteMark(selected.id)}
                      className="inline-flex items-center gap-1 text-[10.5px] font-medium text-[#cc3333] hover:underline"
                    >
                      <FiTrash2 size={11} /> Entfernen
                    </button>
                  </div>
                </div>
              </SysCard>
            ) : (
              <SysCard>
                <SectionHeader title="Karosserieposition" />
                <div className="mt-3 flex flex-col items-center gap-2 py-3 text-center">
                  <div className="grid h-9 w-9 place-items-center rounded-full border border-[#ddd] text-[#bbb]">
                    <FiCrosshair size={16} />
                  </div>
                  <p className="text-[11px] text-[#aaa] max-w-[210px] leading-relaxed">
                    {activeVehicle
                      ? "Klicke auf das Fahrzeug um einen Schaden zu markieren. Tippe auf eine Markierung zum Bearbeiten."
                      : "Wähle zuerst ein Fahrzeug."}
                  </p>
                </div>
              </SysCard>
            )}

            {/* Mechanical tasks */}
            <SysCard>
              <SectionHeader
                icon={<FiTool size={12} />}
                title="Mechanische Arbeiten"
              />
              <div className="mt-2 space-y-2">
                <SysField label="Arbeit">
                  <textarea
                    value={mechanicalDraft.job}
                    onChange={(e) =>
                      setMechanicalDraft((d) => ({ ...d, job: e.target.value }))
                    }
                    rows={2}
                    placeholder="z. B. Bremsscheiben vorne wechseln"
                    className="w-full resize-none rounded border border-[#d0d0d0] bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-[#555]"
                  />
                </SysField>
                <SysField label="Notiz">
                  <textarea
                    value={mechanicalDraft.note}
                    onChange={(e) =>
                      setMechanicalDraft((d) => ({
                        ...d,
                        note: e.target.value,
                      }))
                    }
                    rows={2}
                    placeholder="z. B. Diagnose zuerst durchführen …"
                    className="w-full resize-none rounded border border-[#d0d0d0] bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-[#555]"
                  />
                </SysField>
                <button
                  onClick={addMechanicalTask}
                  disabled={!activeVehicle || !mechanicalDraft.job.trim()}
                  className="flex h-8 w-full items-center justify-center gap-1.5 rounded border border-[#d0d0d0] bg-white text-[11px] font-medium text-[#1a1a1a] hover:bg-[#f0f0f0] disabled:opacity-40 transition"
                >
                  <FiPlus size={12} /> Aufgabe hinzufügen
                </button>
              </div>
            </SysCard>
          </aside>
        </div>
      </div>

      {mobileTreeOpen && (
        <div className="fixed inset-0 z-[80] lg:hidden">
          <button
            className="absolute inset-0 bg-black/35"
            onClick={() => setMobileTreeOpen(false)}
            aria-label="Fahrzeugordner schließen"
          />
          <div className="absolute inset-y-0 left-0 w-[88vw] max-w-[340px] bg-white p-2 shadow-2xl">
            <div className="mb-2 flex items-center justify-between px-1 py-1">
              <span className="text-[12px] font-semibold text-[#333]">
                Fahrzeuge
              </span>
              <button
                onClick={() => setMobileTreeOpen(false)}
                className="grid h-8 w-8 place-items-center rounded border border-[#ddd] bg-white text-[#555]"
              >
                <FiX size={15} />
              </button>
            </div>
            <VehicleTree
              brands={BRANDS}
              vehicles={vehicles}
              activeVehicleId={activeVehicleId}
              onSelect={(id) => {
                setActiveVehicleId(id);
                setMobileTreeOpen(false);
              }}
              onAdd={() => {
                setMobileTreeOpen(false);
                setShowAdd(true);
              }}
              onDeleteVehicle={deleteVehicle}
              onStatusChange={handleStatusChange}
              marksByVehicle={marksByVehicle}
              mechanicalByVehicle={mechanicalByVehicle}
              mobile
            />
          </div>
        </div>
      )}

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

function BeforeRepairPhotos({
  photos,
  uploading,
  inputRef,
  onSelectFiles,
  onDelete,
}) {
  return (
    <SysCard noPad>
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#e0e0e0] px-4 py-3">
        <div className="flex items-center gap-2">
          <FiCamera size={13} className="text-[#555]" />
          <div>
            <div className="text-[12px] font-semibold text-[#1a1a1a]">
              Schadensfotos vor der Reparatur
            </div>
            <div className="text-[10px] text-[#888]">
              {photos.length} Foto(s)
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <input
            ref={inputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/heic,image/heif"
            multiple
            onChange={onSelectFiles}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex h-8 items-center gap-1.5 rounded border border-[#bfc7d2] bg-white px-3 text-[11px] font-semibold text-[#344054] shadow-sm hover:bg-[#f7f8fa] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {uploading ? (
              <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#cfd4dc] border-t-[#344054]" />
            ) : (
              <FiUploadCloud size={13} />
            )}
            {uploading ? "Wird hochgeladen…" : "Fotos aufnehmen / wählen"}
          </button>
        </div>
      </div>

      {photos.length === 0 ? (
        <div className="flex min-h-36 flex-col items-center justify-center gap-2 px-4 py-8 text-center">
          <FiImage size={24} className="text-[#c1c1c1]" />
          <p className="max-w-md text-[11px] leading-relaxed text-[#888]">
            Noch keine Fotos vorhanden.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-2 p-3 sm:grid-cols-3 xl:grid-cols-4">
          {photos.map((photo, index) => (
            <div
              key={photo._id || photo.publicId}
              className="group relative overflow-hidden rounded border border-[#d8d8d8] bg-[#f4f4f4]"
            >
              <a
                href={photo.secureUrl || photo.url}
                target="_blank"
                rel="noreferrer"
                className="block aspect-[4/3]"
              >
                <img
                  src={photo.secureUrl || photo.url}
                  alt={`Schadensfoto vor Reparatur ${index + 1}`}
                  className="h-full w-full object-cover"
                  loading="lazy"
                />
              </a>

              <div className="absolute inset-x-0 bottom-0 flex items-center justify-between gap-2 bg-black/65 px-2 py-1.5 text-white">
                <span className="truncate text-[9px]">
                  Foto {index + 1} · {formatDate(photo.takenAt)}
                </span>
                <div className="flex items-center gap-1">
                  <a
                    href={photo.secureUrl || photo.url}
                    target="_blank"
                    rel="noreferrer"
                    title="Groß öffnen"
                    className="grid h-6 w-6 place-items-center rounded bg-white/15 hover:bg-white/25"
                  >
                    <FiExternalLink size={11} />
                  </a>
                  <button
                    type="button"
                    onClick={() => onDelete(photo)}
                    title="Foto löschen"
                    className="grid h-6 w-6 place-items-center rounded bg-white/15 hover:bg-[#b42318]"
                  >
                    <FiTrash2 size={11} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </SysCard>
  );
}

/* ─── UI Primitives ─────────────────────────────────────── */
function SysCard({ children, noPad = false, className = "" }) {
  return (
    <div
      className={`rounded-lg border border-[#d4d4d4] bg-white shadow-[0_1px_2px_rgba(0,0,0,.06)] ${noPad ? "" : "p-3.5"} ${className}`}
    >
      {children}
    </div>
  );
}
function SectionHeader({ icon, title }) {
  return (
    <div className="flex items-center gap-1.5">
      {icon && <span className="text-[#888]">{icon}</span>}
      <h2 className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#888]">
        {title}
      </h2>
    </div>
  );
}
function SysField({ label, children }) {
  return (
    <div>
      <label className="block mb-1 text-[10px] font-medium text-[#888] uppercase tracking-[.06em]">
        {label}
      </label>
      {children}
    </div>
  );
}
function SysSelect({ value, onChange, options, placeholder }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full appearance-none rounded border border-[#d0d0d0] bg-white px-2.5 py-1.5 pr-7 text-[11px] font-medium text-[#1a1a1a] outline-none focus:border-[#555]"
      >
        {options.map((o) => (
          <option key={o || "_"} value={o}>
            {o === "" ? placeholder || "—" : o}
          </option>
        ))}
      </select>
      <FiChevronDown
        className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#aaa]"
        size={12}
      />
    </div>
  );
}
function SysButton({ onClick, disabled, icon, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 items-center gap-1.5 rounded border border-[#c8c8c8] bg-white px-2.5 text-[11px] font-medium text-[#333] hover:bg-[#f0f0f0] disabled:opacity-40 transition shadow-[0_1px_0_rgba(255,255,255,.7)_inset]"
      style={{
        boxShadow:
          "0 1px 2px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.6)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
function SysPrimaryButton({ onClick, disabled, icon, label }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="inline-flex h-7 items-center gap-1.5 cursor-pointer rounded border border-[#1a1a1a] bg-[#1a1a1a] px-2.5 text-[11px] font-medium text-white hover:bg-[#333] disabled:opacity-40 transition"
      style={{
        boxShadow:
          "0 1px 2px rgba(0,0,0,.2), inset 0 1px 0 rgba(255,255,255,.08)",
      }}
    >
      {icon}
      {label}
    </button>
  );
}
function ViewerIconBtn({ children, onClick, active, title }) {
  return (
    <button
      onClick={onClick}
      title={title}
      className={`grid h-7 w-7 place-items-center rounded border text-[11px] transition ${active ? "border-[#1a1a1a] bg-[#1a1a1a] text-white" : "border-[#d0d0d0] bg-white/90 text-[#555] hover:bg-white"}`}
      style={{ boxShadow: "0 1px 2px rgba(0,0,0,.1)" }}
    >
      {children}
    </button>
  );
}
function MoneyInput({ value, onChange }) {
  return (
    <div className="relative inline-block w-24">
      <input
        type="number"
        min="0"
        step="0.01"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="0,00"
        className="h-7 w-full rounded border border-[#d0d0d0] bg-white pl-2 pr-6 text-right text-[11px] font-semibold tabular-nums text-[#1a1a1a] outline-none focus:border-[#555]"
      />
      <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[9.5px] text-[#aaa]">
        €
      </span>
    </div>
  );
}

/* ─── Modals ─────────────────────────────────────────────── */
function AddVehicleModal({ brands, onClose, onAdd }) {
  const [brandId, setBrandId] = useState(brands[0]?.id || "");
  const [name, setName] = useState("");
  const [fin, setFin] = useState("");
  const valid = brandId && name.trim();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-lg border border-[#c8c8c8] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e8e8e8] px-4 py-3">
          <h3 className="text-[12px] font-semibold text-[#1a1a1a]">
            Neues Fahrzeug
          </h3>
          <button onClick={onClose} className="text-[#aaa] hover:text-[#555]">
            <FiX size={14} />
          </button>
        </div>
        <div className="space-y-3 px-4 py-3">
          <SysField label="Marke">
            <SysSelect
              value={brandId}
              onChange={setBrandId}
              options={brands.map((b) => b.id)}
            />
          </SysField>
          <SysField label="Bezeichnung">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="z. B. GLK 220 CDI"
              className="w-full rounded border border-[#d0d0d0] bg-white px-2.5 py-1.5 text-[11px] outline-none focus:border-[#555]"
            />
          </SysField>
          <SysField label="FIN (optional)">
            <input
              value={fin}
              onChange={(e) => setFin(e.target.value)}
              placeholder="z. B. WDC2049811A123456"
              className="w-full rounded border border-[#d0d0d0] bg-white px-2.5 py-1.5 text-[11px] font-mono outline-none focus:border-[#555]"
            />
          </SysField>
        </div>
        <div className="flex justify-end gap-2 border-t border-[#e8e8e8] px-4 py-3">
          <SysButton onClick={onClose} label="Abbrechen" />
          <SysPrimaryButton
            onClick={() => valid && onAdd({ brandId, name, fin })}
            disabled={!valid}
            label="Hinzufügen"
          />
        </div>
      </div>
    </div>
  );
}

function BillingRangeModal({ onClose, onPrint }) {
  const now = new Date();
  const [from, setFrom] = useState(
    new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10),
  );
  const [to, setTo] = useState(now.toISOString().slice(0, 10));
  return (
    <div className="fixed inset-0 z-[70] grid place-items-center bg-black/30 p-4">
      <div className="w-full max-w-sm rounded-lg border border-[#c8c8c8] bg-white shadow-xl">
        <div className="flex items-center justify-between border-b border-[#e8e8e8] px-4 py-3">
          <div className="flex items-center gap-2">
            <FiCalendar size={13} className="text-[#555]" />
            <h3 className="text-[12px] font-semibold text-[#1a1a1a] ">
              Abrechnungen drucken
            </h3>
          </div>
          <button onClick={onClose} className="text-[#aaa] hover:text-[#555]">
            <FiX size={14} />
          </button>
        </div>
        <div className="grid grid-cols-2 gap-3 px-4 py-4">
          <SysField label="Von">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="h-8 w-full rounded border border-[#d0d0d0] bg-white px-2.5 text-[11px] outline-none focus:border-[#555]"
            />
          </SysField>
          <SysField label="Bis">
            <input
              type="date"
              value={to}
              min={from || undefined}
              onChange={(e) => setTo(e.target.value)}
              className="h-8 w-full rounded border border-[#d0d0d0] bg-white px-2.5 text-[11px] outline-none focus:border-[#555]"
            />
          </SysField>
          <p className="col-span-2 rounded border border-[#d8e4f0] bg-[#eef4fb] px-3 py-2 text-[10.5px] text-[#336] leading-relaxed">
            Alle Fahrzeuge im gewählten Zeitraum werden in einer Übersicht
            zusammengefasst.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t  border-[#e8e8e8] px-4 py-3">
          <SysButton onClick={onClose} label="Abbrechen" />
          <SysPrimaryButton
            onClick={() => onPrint({ from, to })}
            disabled={!from || !to || from > to}
            icon={<FiPrinter size={11} />}
            label="Drucken"
          />
        </div>
      </div>
    </div>
  );
}

/* ─── Vehicle Tree ───────────────────────────────────────── */
function VehicleTree({
  brands,
  vehicles,
  activeVehicleId,
  onSelect,
  onAdd,
  onDeleteVehicle,
  onStatusChange,
  marksByVehicle,
  mechanicalByVehicle,
  mobile = false,
}) {
  const [query, setQuery] = useState("");
  const [timeFilter, setTimeFilter] = useState("all");
  const [openBrands, setOpenBrands] = useState({});

  useEffect(() => {
    setOpenBrands((current) => {
      const next = { ...current };
      brands.forEach((brand) => {
        const hasUnfinished = vehicles.some(
          (vehicle) =>
            vehicle.brandId === brand.id && vehicle.status !== "completed",
        );
        if (hasUnfinished) next[brand.id] = true;
      });
      return next;
    });
  }, [brands, vehicles]);

  const filteredBrands = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return brands.map((brand) => {
      const bv = vehicles.filter((v) => {
        if (v.brandId !== brand.id) return false;
        const d = new Date(v.createdAt || Date.now()),
          now = new Date();
        const som = new Date(now.getFullYear(), now.getMonth(), 1);
        const solm = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        const eolm = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
        const soy = new Date(now.getFullYear(), 0, 1);
        if (timeFilter === "month" && d < som) return false;
        if (timeFilter === "lastMonth" && (d < solm || d > eolm)) return false;
        if (timeFilter === "year" && d < soy) return false;
        if (!needle) return true;
        return `${v.name} ${v.fin || ""} ${brand.label}`
          .toLowerCase()
          .includes(needle);
      });
      return { ...brand, vehicles: bv };
    });
  }, [brands, vehicles, query, timeFilter]);

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-lg border border-[#d4d4d4] bg-white shadow-[0_1px_2px_rgba(0,0,0,.06)] ${mobile ? "h-[calc(100vh-64px)]" : "min-h-[600px]"}`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b border-[#e8e8e8] bg-[#f5f5f5] px-3 py-2"
        style={{ boxShadow: "inset 0 -1px 0 rgba(0,0,0,.04)" }}
      >
        <span className="text-[10px] font-semibold uppercase tracking-[.08em] text-[#888]">
          Fahrzeuge
        </span>
        <button
          onClick={onAdd}
          className="inline-flex h-6 items-center gap-1 rounded border border-[#c8c8c8] bg-white px-2 text-[10px] font-medium text-[#333] hover:bg-[#f0f0f0]"
          style={{
            boxShadow:
              "0 1px 1px rgba(0,0,0,.06), inset 0 1px 0 rgba(255,255,255,.7)",
          }}
        >
          <FiPlus size={10} /> Neu
        </button>
      </div>

      {/* Search */}
      <div className="px-2.5 py-2 border-b border-[#ebebeb]">
        <div className="relative">
          <FiSearch
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-[#aaa]"
            size={11}
          />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Suchen …"
            className="h-7 w-full rounded border border-[#d0d0d0] bg-white pl-6 pr-2.5 text-[11px] outline-none focus:border-[#555] placeholder:text-[#bbb]"
          />
        </div>
      </div>

      {/* Time filter */}
      <div className="px-2.5 py-1.5 border-b border-[#ebebeb]">
        <div className="flex gap-0.5 rounded border border-[#d0d0d0] bg-[#f0f0f0] p-0.5">
          {[
            ["all", "Alle"],
            ["month", "Monat"],
            ["lastMonth", "Letzt."],
            ["year", "Jahr"],
          ].map(([v, l]) => (
            <button
              key={v}
              onClick={() => setTimeFilter(v)}
              className={`flex-1 rounded py-1 text-[9px] font-medium transition ${timeFilter === v ? "bg-white text-[#1a1a1a] shadow-sm border border-[#d0d0d0]" : "text-[#888] hover:text-[#555]"}`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>

      {/* Tree */}
      <div className="flex-1 overflow-auto py-1">
        {filteredBrands.map((brand) => {
          const unfinishedCount = brand.vehicles.filter(
            (vehicle) => vehicle.status !== "completed",
          ).length;
          const open =
            !!openBrands[brand.id] ||
            unfinishedCount > 0 ||
            (query && brand.vehicles.length > 0);
          return (
            <div key={brand.id}>
              <button
                onClick={() =>
                  setOpenBrands((p) => ({ ...p, [brand.id]: !p[brand.id] }))
                }
                className={`group flex w-full items-center gap-1.5 px-2.5 py-1.5 text-left ${
                  unfinishedCount > 0
                    ? "bg-[#eef5ff] hover:bg-[#e2edfc]"
                    : "hover:bg-[#f5f5f5]"
                }`}
              >
                <span className="text-[#bbb] flex-none">
                  {open ? (
                    <FiChevronDown size={11} />
                  ) : (
                    <FiChevronRight size={11} />
                  )}
                </span>
                <FiFolder
                  size={12}
                  className={`flex-none ${unfinishedCount > 0 ? "text-[#3974c6]" : "text-[#7aa486]"}`}
                />
                <span className="flex-1 min-w-0 truncate text-[11px] font-medium text-[#333]">
                  {brand.label}
                </span>
                <span className="text-[9px] tabular-nums text-[#bbb] flex-none">
                  {unfinishedCount > 0
                    ? `${unfinishedCount} offen`
                    : brand.vehicles.length}
                </span>
              </button>
              {open && (
                <div className="ml-4 border-l border-[#e8e8e8] pl-2">
                  {brand.vehicles.length === 0 ? (
                    <p className="px-2 py-1.5 text-[10px] text-[#bbb]">
                      Keine Fahrzeuge
                    </p>
                  ) : (
                    brand.vehicles.map((v) => {
                      const active = v.id === activeVehicleId;
                      const bc = marksByVehicle[v.id]?.length || 0;
                      const mc = mechanicalByVehicle[v.id]?.length || 0;
                      const completed = v.status === "completed";
                      return (
                        <div
                          key={v.id}
                          className={`group flex items-center rounded border-l-2 ${
                            active
                              ? "border-[#1a4db3] bg-[#e8eef8]"
                              : completed
                                ? "border-[#72a981] bg-[#f3faf5] hover:bg-[#eaf6ed]"
                                : "border-[#7fa8dd] bg-[#f3f7fd] hover:bg-[#e8f1fc]"
                          }`}
                        >
                          <button
                            onClick={() => onSelect(v.id)}
                            className="flex-1 min-w-0 px-2 py-1.5 text-left"
                          >
                            <p
                              className={`truncate text-[11px] font-medium ${active ? "text-[#1a4db3]" : "text-[#1a1a1a]"}`}
                            >
                              {v.name}
                            </p>
                            <p className="text-[9.5px] text-[#aaa] mt-0.5 truncate">
                              {completed ? "Abgeschlossen" : "Offen"}
                              {v.fin ? ` · ${v.fin}` : " · Keine FIN"}
                              {bc + mc > 0 ? ` · ${bc + mc} Aufg.` : ""}
                            </p>
                          </button>
                          <button
                            onClick={() =>
                              onStatusChange(
                                v.id,
                                completed ? "in_progress" : "completed",
                              )
                            }
                            title={
                              completed
                                ? "Wieder öffnen"
                                : "Als abgeschlossen markieren"
                            }
                            className={`mr-0.5 grid h-6 w-6 flex-none place-items-center rounded ${
                              completed
                                ? "text-[#2f7a46] hover:bg-[#dff0e4]"
                                : "text-[#3974c6] hover:bg-[#dceafd]"
                            }`}
                          >
                            <FiCheckCircle size={12} />
                          </button>
                          <button
                            onClick={() => onDeleteVehicle(v.id)}
                            className="mr-1 rounded p-1 text-[#ddd] opacity-0 hover:text-[#cc3333] group-hover:opacity-100"
                          >
                            <FiTrash2 size={10} />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Three.js helpers (unchanged logic, same as original) ── */
function buildDamageTextures(THREE) {
  const S = 512,
    M = S / 2;
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
  const scratch = tex((ctx) => {
    for (let i = 0; i < 5; i++) {
      const yy = M + (i - 2) * 14 + (Math.random() * 8 - 4),
        len = 0.6 + Math.random() * 0.34,
        x0 = M - (len * S) / 2,
        x1 = M + (len * S) / 2,
        wob = Math.random() * 14 - 7;
      ctx.lineCap = "round";
      ctx.strokeStyle = `rgba(35,32,38,${0.3 + Math.random() * 0.3})`;
      ctx.lineWidth = 2 + Math.random() * 2.5;
      ctx.beginPath();
      ctx.moveTo(x0, yy);
      ctx.bezierCurveTo(M - 60, yy + wob, M + 60, yy - wob, x1, yy);
      ctx.stroke();
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
    const shadow = ctx.createRadialGradient(M + 26, M + 30, 8, M, M, M * 0.92);
    shadow.addColorStop(0, "rgba(14,14,20,0.52)");
    shadow.addColorStop(0.55, "rgba(28,28,36,0.24)");
    shadow.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = shadow;
    ctx.beginPath();
    ctx.ellipse(M, M, M * 0.92, M * 0.78, 0, 0, Math.PI * 2);
    ctx.fill();
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
    ctx.beginPath();
    for (let i = 0; i <= 16; i++) {
      const a = (i / 16) * Math.PI * 2,
        r = M * (0.46 + Math.random() * 0.34);
      i === 0
        ? ctx.moveTo(M + Math.cos(a) * r, M + Math.sin(a) * r)
        : ctx.lineTo(M + Math.cos(a) * r, M + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fillStyle = "rgba(46,34,36,0.42)";
    ctx.fill();
    ctx.save();
    ctx.clip();
    const pg = ctx.createRadialGradient(M, M, 4, M, M, M * 0.7);
    pg.addColorStop(0, "rgba(214,212,216,0.62)");
    pg.addColorStop(0.7, "rgba(190,186,190,0.32)");
    pg.addColorStop(1, "rgba(150,120,120,0.05)");
    ctx.fillStyle = pg;
    ctx.fillRect(0, 0, S, S);
    ctx.restore();
    for (let i = 0; i < 14; i++) {
      const a = Math.random() * Math.PI * 2,
        r = M * (0.45 + Math.random() * 0.4);
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
    const g = ctx.createRadialGradient(M, M, 4, M, M, M * 0.96);
    g.addColorStop(0, "rgba(120,55,18,0.72)");
    g.addColorStop(0.45, "rgba(150,82,28,0.5)");
    g.addColorStop(0.8, "rgba(168,98,40,0.22)");
    g.addColorStop(1, "rgba(168,98,40,0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    for (let i = 0; i <= 18; i++) {
      const a = (i / 18) * Math.PI * 2,
        r = M * (0.6 + Math.sin(i * 1.7) * 0.12 + Math.random() * 0.22);
      i === 0
        ? ctx.moveTo(M + Math.cos(a) * r, M + Math.sin(a) * r)
        : ctx.lineTo(M + Math.cos(a) * r, M + Math.sin(a) * r);
    }
    ctx.closePath();
    ctx.fill();
    for (let i = 0; i < 1400; i++) {
      const a = Math.random() * Math.PI * 2,
        r = Math.random() * M * 0.82;
      ctx.fillStyle =
        Math.random() < 0.5
          ? `rgba(${90 + Math.random() * 60},${40 + Math.random() * 35},12,${Math.random() * 0.5})`
          : `rgba(${40 + Math.random() * 30},20,8,${Math.random() * 0.45})`;
      ctx.fillRect(M + Math.cos(a) * r, M + Math.sin(a) * r, 2, 2);
    }
  });
  const crack = tex((ctx) => {
    const branch = (x, y, ang, len, depth) => {
      if (depth <= 0 || len < 4) return;
      const nx = x + Math.cos(ang) * len,
        ny = y + Math.sin(ang) * len;
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
    const a0 = (Math.random() - 0.5) * 0.7;
    branch(M, M, a0, S * 0.2, 5);
    branch(M, M, a0 + Math.PI + (Math.random() - 0.5) * 0.5, S * 0.2, 5);
  });
  const other = tex((ctx) => {
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
    cy = S / 2,
    r = selected ? S * 0.4 : S * 0.36;
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
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(cx, cy, r - 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${selected ? 46 : 42}px system-ui,sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(String(n), cx, cy + 1);
  const t = new THREE.CanvasTexture(c);
  t.anisotropy = 4;
  t.userData = { ephemeral: true };
  return t;
}
function softHaloTexture(THREE) {
  const S = 128;
  const c = document.createElement("canvas");
  c.width = c.height = S;
  const ctx = c.getContext("2d");
  const g = ctx.createRadialGradient(S / 2, S / 2, 2, S / 2, S / 2, S / 2);
  g.addColorStop(0, "rgba(50,50,80,0.45)");
  g.addColorStop(0.5, "rgba(50,50,80,0.15)");
  g.addColorStop(1, "rgba(50,50,80,0)");
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
  ctx.strokeStyle = "#1a1a1a";
  ctx.beginPath();
  ctx.arc(cx, cy, r, 0, Math.PI * 2);
  ctx.stroke();
  if (accent) {
    ctx.fillStyle = "#1a1a1a";
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
      if (mm.map && mm.map.userData?.ephemeral) mm.map.dispose?.();
      mm.dispose?.();
    });
  }
}
function cachedTex(t, key, make) {
  if (!t._tex) t._tex = {};
  if (t._tex[key]) return t._tex[key];
  const tex = make();
  tex.userData = { cached: true };
  t._tex[key] = tex;
  return tex;
}
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
  const R = t.localCarRadius || 2,
    isElong = ELONGATED.has(spec.type);
  const sizeFrac = cl(spec.size, 0.02, 0.35),
    lenFrac = cl(spec.length || sizeFrac, 0.04, 0.6);
  const width = isElong ? lenFrac * R : sizeFrac * R,
    height = isElong ? sizeFrac * 0.6 * R : sizeFrac * R;
  const offset = R * 0.006,
    surfacePos = pos.clone().add(nrm.clone().multiplyScalar(offset));
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
  decal.userData.markId = spec.id;
  decal.userData.pick = true;
  decal.renderOrder = 10;
  group.add(decal);
  if (isSel && !draft) {
    const halo = new THREE.Mesh(
      new THREE.PlaneGeometry(width * 2 * 1.7, height * 2 * 1.7),
      new THREE.MeshBasicMaterial({
        map: cachedTex(t, "halo", () => softHaloTexture(THREE)),
        transparent: true,
        depthWrite: false,
        depthTest: false,
        opacity: 0.45,
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
  if (number == null) return;
  const pinSize = R * (isSel ? 0.115 : 0.088),
    lift = R * 0.12 + (isSel ? R * 0.02 : 0);
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
      opacity: 0.5,
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
function addHandles(t, group, m) {
  const { THREE } = t;
  const nrm = new THREE.Vector3(...(m.normal || [0, 0, 1])).normalize();
  const q = new THREE.Quaternion().setFromUnitVectors(
    new THREE.Vector3(0, 0, 1),
    nrm,
  );
  const ex = new THREE.Vector3(1, 0, 0).applyQuaternion(q),
    ey = new THREE.Vector3(0, 1, 0).applyQuaternion(q);
  const center = new THREE.Vector3(...m.local),
    R = t.localCarRadius || 2,
    lift = nrm.clone().multiplyScalar(R * 0.008),
    knobSize = R * 0.055;
  const addKnob = (lp, handle, accent) => {
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
    sp.position.copy(lp).add(lift);
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
        color: new THREE.Color("#555"),
        transparent: true,
        opacity: 0.4,
        depthTest: false,
      }),
    );
    ln.renderOrder = 25;
    group.add(ln);
  };
  if (!ELONGATED.has(m.type)) {
    const radius = (m.size || 0.06) * R,
      rim = center.clone().add(ex.clone().multiplyScalar(radius));
    addGuide(center, rim);
    addKnob(rim, "radius", true);
    return;
  }
  const rot = m.rotation || 0,
    axis = ex
      .clone()
      .multiplyScalar(Math.cos(rot))
      .add(ey.clone().multiplyScalar(Math.sin(rot)));
  const perp = ex
    .clone()
    .multiplyScalar(-Math.sin(rot))
    .add(ey.clone().multiplyScalar(Math.cos(rot)));
  const half = (m.length || 0.14) * R,
    endA = center.clone().add(axis.clone().multiplyScalar(-half)),
    endB = center.clone().add(axis.clone().multiplyScalar(half));
  const wOff = (m.size || 0.04) * 0.6 * R + R * 0.05,
    widthH = center.clone().add(perp.clone().multiplyScalar(wOff));
  addGuide(endA, endB);
  addGuide(center, widthH);
  addKnob(endA, "endA", false);
  addKnob(endB, "endB", false);
  addKnob(widthH, "width", true);
}

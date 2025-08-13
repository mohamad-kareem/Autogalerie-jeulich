"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  FiSearch,
  FiUsers,
  FiPieChart,
  FiShield,
  FiPackage,
  FiX,
  FiPlus,
  FiSave,
  FiEdit2,
  FiTrash2,
  FiChevronDown,
  FiChevronUp,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";

/* =========================================================
   API HELPERS (Cloudinary upload + Medicines CRUD)
   ========================================================= */
async function apiListMedicines({ q = "", category = "All" } = {}) {
  const url = new URL("/api/medicines", window.location.origin);
  if (q) url.searchParams.set("q", q);
  if (category) url.searchParams.set("category", category);
  const res = await fetch(url.toString(), { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to load medicines");
  return await res.json(); // { items: [...] }
}

async function apiCreateMedicine(payload) {
  const res = await fetch("/api/medicines", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Create failed");
  }
  return await res.json();
}

async function apiUpdateMedicine(id, payload) {
  const res = await fetch(`/api/medicines/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Update failed");
  }
  return await res.json();
}

async function apiDeleteMedicine(id) {
  const res = await fetch(`/api/medicines/${id}`, { method: "DELETE" });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Delete failed");
  }
  return await res.json();
}

async function apiUploadImage(file) {
  const fd = new FormData();
  fd.append("file", file);
  const res = await fetch("/api/upload", { method: "POST", body: fd });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error || "Upload failed");
  }
  return await res.json(); // { url, public_id }
}

/* =========================================================
   UI Components
   ========================================================= */
const difficultyColors = {
  Low: "bg-green-100 text-green-800",
  Medium: "bg-amber-100 text-amber-800",
  High: "bg-red-100 text-red-800",
};

function FallbackImg({ src, alt, className }) {
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={(e) => {
        e.currentTarget.onerror = null;
        e.currentTarget.src = "/B12.png";
      }}
    />
  );
}

function StatCard({ icon: Icon, value, label, color }) {
  return (
    <motion.div
      whileHover={{ y: -2 }}
      className={`bg-white rounded-lg p-3 sm:p-4 border-l-4 ${color} shadow-sm min-w-0`}
    >
      <div className="flex items-center justify-between">
        <div className="min-w-0">
          <p className="text-[10px] sm:text-xs font-medium text-gray-500 uppercase tracking-wider truncate">
            {label}
          </p>
          <h3 className="text-lg sm:text-xl font-bold text-gray-800 mt-1 truncate">
            {value}
          </h3>
        </div>
        <div
          className={`p-1.5 sm:p-2 rounded-lg ${color.replace("border", "bg")}`}
        >
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
        </div>
      </div>
    </motion.div>
  );
}

function MedicineCard({ medicine, selected, onClick, onEdit, onDelete }) {
  return (
    <motion.div layout className="relative group">
      <motion.button
        type="button"
        onClick={onClick}
        aria-label={`Open ${medicine.name}`}
        whileHover={{ y: -2 }}
        layout
        className={[
          "w-full text-left rounded-lg border relative overflow-hidden",
          "transition-all duration-200",
          selected
            ? "bg-indigo-50 ring-1 ring-indigo-500 border-indigo-300 shadow-md"
            : "bg-white border-gray-200 hover:shadow-sm",
        ].join(" ")}
      >
        <div className="relative h-40 bg-gray-50 flex items-center justify-center">
          <FallbackImg
            src={medicine.image}
            alt={medicine.name}
            className="max-h-full max-w-full object-contain p-2"
          />
          <div className="absolute top-2 right-2">
            <span
              className={`px-2 py-1 rounded text-xs font-medium ${
                difficultyColors[medicine.difficulty] ||
                "bg-gray-100 text-gray-800"
              }`}
            >
              {medicine.difficulty || "—"}
            </span>
          </div>
        </div>

        <div className="p-3">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3 className="text-sm font-semibold text-gray-900 truncate">
              {medicine.name}
            </h3>
            <span className="text-xs font-medium text-indigo-600 whitespace-nowrap">
              {medicine.category}
            </span>
          </div>

          <p className="text-gray-600 text-xs line-clamp-2 mb-2">
            {medicine.description}
          </p>

          <div className="flex items-center justify-between text-xs text-gray-500">
            <div className="flex items-center">
              <FiUsers className="mr-1 shrink-0" />
              <span>{medicine.employeesRequired} employees</span>
            </div>
            <div className="text-xs bg-gray-100 px-2 py-1 rounded">
              {medicine.productionTime}
            </div>
          </div>
        </div>
      </motion.button>

      {/* edit / delete actions */}
      <div className="absolute top-2 left-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => {
            e.stopPropagation();
            onEdit?.();
          }}
          className="bg-white text-gray-700 p-1 rounded shadow hover:bg-gray-100 border border-gray-200"
          title="Edit"
        >
          <FiEdit2 className="h-3 w-3" />
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onDelete?.();
          }}
          className="bg-white text-gray-700 p-1 rounded shadow hover:bg-gray-100 border border-gray-200"
          title="Delete"
        >
          <FiTrash2 className="h-3 w-3" />
        </button>
      </div>
    </motion.div>
  );
}

function MedicineModal({ medicine, onClose }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50"
    >
      <div
        className="absolute inset-0 bg-gray-900/60"
        onClick={onClose}
        aria-hidden="true"
      />
      <motion.div
        role="dialog"
        aria-modal="true"
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        className="relative mx-auto my-6 w-[92%] sm:w-[85%] md:w-[760px] lg:w-[800px] max-w-[95vw] bg-white rounded-xl shadow-xl overflow-hidden"
      >
        <div className="px-5 py-4 border-b flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {medicine.name}
            </h3>
            <p className="text-indigo-600 text-xs font-medium">
              {medicine.category}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
            aria-label="Close details"
          >
            <FiX className="h-5 w-5" />
          </button>
        </div>

        <div className="p-5 grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <div className="h-48 bg-gray-50 rounded-lg overflow-hidden mb-4">
              <FallbackImg
                src={medicine.image}
                alt={medicine.name}
                className="w-full h-full object-contain"
              />
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 text-sm mb-1.5">
                Description
              </h4>
              <p className="text-gray-600 text-sm">{medicine.description}</p>
            </div>

            <div className="mb-2">
              <h4 className="font-medium text-gray-900 text-sm mb-1.5">
                Quality Control
              </h4>
              <div className="flex items-center text-sm">
                <FiShield className="text-green-500 mr-2" />
                <span className="text-gray-700">{medicine.qualityControl}</span>
              </div>
            </div>
          </div>

          <div>
            <div className="bg-indigo-50 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-indigo-900 text-sm mb-2">
                Production Details
              </h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Status:</span>
                  <span className="font-medium">{medicine.status}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Batch Size:</span>
                  <span className="font-medium">
                    {Number(medicine.batchSize).toLocaleString()}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Last Produced:</span>
                  <span className="font-medium">
                    {medicine.lastProduced
                      ? new Date(medicine.lastProduced).toLocaleDateString()
                      : "—"}
                  </span>
                </div>
              </div>
            </div>

            <div className="mb-4">
              <h4 className="font-medium text-gray-900 text-sm mb-2">
                Employee Requirements
              </h4>
              <div className="border border-gray-200 rounded-lg p-3 bg-white">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <FiUsers className="text-indigo-500 mr-2" />
                    <span className="font-medium">Total Employees:</span>
                  </div>
                  <span className="text-lg font-bold text-indigo-600">
                    {medicine.employeesRequired}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-indigo-500"
                    style={{
                      width: `${Math.min(
                        Number(medicine.employeesRequired || 0) * 5,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 text-sm mb-2">
                Key Ingredients
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {(medicine.ingredients || []).map((ing, i) => (
                  <span
                    key={`${ing}-${i}`}
                    className="bg-blue-100 text-blue-800 text-xs px-2 py-0.5 rounded"
                  >
                    {ing}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 border-t flex justify-end">
          <button
            onClick={onClose}
            className="inline-flex items-center px-3 py-1.5 rounded-md bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
          >
            Close
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function UpsertMedicineModal({ open, onClose, initial, onSave }) {
  const isEdit = Boolean(initial?._id);

  const [form, setForm] = useState({
    name: initial?.name || "",
    category: initial?.category || "Vitamins",
    productionTime: initial?.productionTime || "3 days",
    employeesRequired: initial?.employeesRequired ?? 8,
    difficulty: initial?.difficulty || "Low",
    ingredients: (initial?.ingredients || []).join(", "),
    description: initial?.description || "",
    status: initial?.status || "Active Production",
    batchSize: initial?.batchSize ?? 1000,
    qualityControl: initial?.qualityControl || "",
    lastProduced: initial?.lastProduced
      ? new Date(initial.lastProduced).toISOString().slice(0, 10)
      : new Date().toISOString().slice(0, 10),
    imageUrl: initial?.image || "/B12.png",
    imagePublicId: initial?.imagePublicId || "",
    imageFile: null,
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const firstFieldRef = useRef(null);

  useEffect(() => {
    if (open) setTimeout(() => firstFieldRef.current?.focus(), 50);
  }, [open]);

  function update(k, v) {
    setForm((f) => ({ ...f, [k]: v }));
  }

  async function submit(e) {
    e.preventDefault();
    setError("");
    if (!form.name.trim()) return setError("Name is required.");
    if (!form.description.trim()) return setError("Description is required.");
    if (!form.category.trim()) return setError("Category is required.");

    setSaving(true);
    try {
      let image = form.imageUrl;
      let imagePublicId = form.imagePublicId;

      if (form.imageFile) {
        const { url, public_id } = await apiUploadImage(form.imageFile);
        image = url;
        imagePublicId = public_id;
      }

      const payload = {
        name: form.name.trim(),
        category: form.category.trim(),
        productionTime: form.productionTime,
        employeesRequired: Number(form.employeesRequired) || 0,
        difficulty: form.difficulty,
        ingredients: form.ingredients
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean),
        description: form.description.trim(),
        status: form.status,
        batchSize: Number(form.batchSize) || 0,
        qualityControl: form.qualityControl || "—",
        lastProduced: form.lastProduced,
        image,
        imagePublicId,
      };

      await onSave(payload, isEdit ? initial._id : null);
      onClose();
    } catch (err) {
      setError(err?.message || "Could not save medicine.");
    } finally {
      setSaving(false);
    }
  }

  if (!open) return null;

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50"
        >
          {/* Backdrop centered container */}
          <div
            className="absolute inset-0 bg-gray-900/60"
            onClick={onClose}
            aria-hidden="true"
          />
          <div className="absolute inset-0 flex items-center justify-center p-3 sm:p-6">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 8 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              className="relative w-full sm:w-[85%] md:w-[720px] max-w-[95vw] bg-white rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[90vh]"
              role="dialog"
              aria-modal="true"
            >
              {/* Sticky header */}
              <div className="px-5 py-4 border-b flex items-center justify-between sticky top-0 bg-white z-10">
                <h3 className="text-base font-semibold">
                  {isEdit ? "Edit Medicine" : "Add New Medicine"}
                </h3>
                <button
                  onClick={onClose}
                  className="p-1 rounded-md hover:bg-gray-100 text-gray-500"
                  aria-label="Close modal"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <form onSubmit={submit} className="flex-1 overflow-y-auto">
                <div className="p-5 space-y-4">
                  {error && (
                    <div className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-1.5 rounded">
                      {error}
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Name
                      </label>
                      <input
                        ref={firstFieldRef}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                        value={form.name}
                        onChange={(e) => update("name", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Category
                      </label>
                      <input
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                        value={form.category}
                        onChange={(e) => update("category", e.target.value)}
                        list="categories"
                      />
                      <datalist id="categories">
                        <option>Vitamins</option>
                        <option>Pain Relief</option>
                        <option>Diabetes</option>
                        <option>Cholesterol</option>
                        <option>GERD</option>
                        <option>Antidepressant</option>
                      </datalist>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Production Time
                      </label>
                      <input
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                        value={form.productionTime}
                        onChange={(e) =>
                          update("productionTime", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Employees Required
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                        value={form.employeesRequired}
                        onChange={(e) =>
                          update("employeesRequired", e.target.value)
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Difficulty
                      </label>
                      <select
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                        value={form.difficulty}
                        onChange={(e) => update("difficulty", e.target.value)}
                      >
                        <option>Low</option>
                        <option>Medium</option>
                        <option>High</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Batch Size
                      </label>
                      <input
                        type="number"
                        min={0}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                        value={form.batchSize}
                        onChange={(e) => update("batchSize", e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">
                        Ingredients (comma separated)
                      </label>
                      <input
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                        value={form.ingredients}
                        onChange={(e) => update("ingredients", e.target.value)}
                        placeholder="Cyanocobalamin, Microcrystalline Cellulose, ..."
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">
                        Description
                      </label>
                      <textarea
                        rows={3}
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                        value={form.description}
                        onChange={(e) => update("description", e.target.value)}
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Status
                      </label>
                      <input
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                        value={form.status}
                        onChange={(e) => update("status", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Quality Control
                      </label>
                      <input
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                        value={form.qualityControl}
                        onChange={(e) =>
                          update("qualityControl", e.target.value)
                        }
                        placeholder="ISO 13485 Certified"
                      />
                    </div>

                    <div>
                      <label className="block text-xs text-gray-600 mb-1">
                        Last Produced
                      </label>
                      <input
                        type="date"
                        className="w-full border rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500"
                        value={form.lastProduced}
                        onChange={(e) => update("lastProduced", e.target.value)}
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="block text-xs text-gray-600 mb-1">
                        Product Image
                      </label>
                      <div className="flex items-center gap-3">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              update("imageFile", file);
                              update("imageUrl", URL.createObjectURL(file));
                              update("imagePublicId", "");
                            }
                          }}
                          className="block w-full text-xs text-gray-700 file:mr-3 file:py-1.5 file:px-3 file:rounded file:border-0 file:text-xs file:font-medium file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100"
                        />
                        {form.imageUrl && (
                          <img
                            src={form.imageUrl}
                            alt="preview"
                            className="h-12 w-12 object-contain bg-gray-50 rounded border"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sticky footer */}
                <div className="px-5 py-3 border-t bg-white sticky bottom-0">
                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-3 py-1.5 rounded-md border border-gray-300 text-xs text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={saving}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md bg-indigo-600 text-xs text-white hover:bg-indigo-700 disabled:opacity-60"
                    >
                      {saving ? (
                        <>
                          <FiSave className="h-3 w-3" /> Saving…
                        </>
                      ) : (
                        <>
                          <FiSave className="h-3 w-3" /> Save
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </form>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/* =======================  MAIN PAGE  ======================== */

export default function MedicineProduction() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const [selectedMedicine, setSelectedMedicine] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  const [showUpsert, setShowUpsert] = useState(false);
  const [editTarget, setEditTarget] = useState(null);

  useEffect(() => {
    let abort = false;
    (async () => {
      try {
        setLoading(true);
        const res = await apiListMedicines({
          q: searchTerm,
          category: selectedCategory,
        });
        if (!abort) setData(res.items || []);
      } catch (e) {
        console.error(e);
        if (!abort) setData([]);
      } finally {
        if (!abort) setLoading(false);
      }
    })();
    return () => {
      abort = true;
    };
  }, [searchTerm, selectedCategory]);

  const categories = useMemo(() => {
    const s = new Set(data.map((m) => m.category));
    return ["All", ...Array.from(s).sort()];
  }, [data]);

  const openMedicine = (m) => {
    setSelectedMedicine(m);
    setShowDetails(true);
  };

  async function handleSave(payload, id = null) {
    if (id) {
      await apiUpdateMedicine(id, payload);
    } else {
      await apiCreateMedicine(payload);
    }
    const res = await apiListMedicines({
      q: searchTerm,
      category: selectedCategory,
    });
    setData(res.items || []);
  }

  async function handleDelete(id) {
    const ok = window.confirm("Delete this medicine?");
    if (!ok) return;
    await apiDeleteMedicine(id);
    const res = await apiListMedicines({
      q: searchTerm,
      category: selectedCategory,
    });
    setData(res.items || []);
  }

  const totalEmployees = useMemo(
    () => data.reduce((sum, m) => sum + (Number(m.employeesRequired) || 0), 0),
    [data]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-5">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-5">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
            Pharma Production Dashboard
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            Track medicine production and employee allocation
          </p>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          <StatCard
            icon={FiPackage}
            value={data.length}
            label="Total Medicines"
            color="border-blue-500"
          />
          <StatCard
            icon={FiUsers}
            value={totalEmployees}
            label="Active Employees"
            color="border-green-500"
          />
          <StatCard
            icon={FiPieChart}
            value={Math.max(categories.length - 1, 0)}
            label="Categories"
            color="border-purple-500"
          />
        </div>

        {/* Controls */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1 max-w-xl">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <FiSearch className="h-4 w-4 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search medicines..."
                className="block w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="hidden sm:flex items-center gap-3">
              <div className="flex items-center">
                <select
                  className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500"
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                >
                  {categories.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => {
                  setEditTarget(null);
                  setShowUpsert(true);
                }}
                className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
              >
                <FiPlus className="h-4 w-4" /> Add
              </button>
            </div>

            <button
              onClick={() => setShowFilters((v) => !v)}
              className="sm:hidden inline-flex items-center gap-1 px-3 py-2 rounded-md border border-gray-300 text-sm text-gray-700"
            >
              {showFilters ? <FiChevronUp /> : <FiChevronDown />} Filters
            </button>
          </div>

          <AnimatePresence initial={false}>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="sm:hidden overflow-hidden"
              >
                <div className="pt-3 flex flex-col gap-3">
                  <div className="flex items-center gap-2">
                    <select
                      className="flex-1 border border-gray-300 rounded-md px-3 py-2 text-sm"
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                    >
                      {categories.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() => {
                        setEditTarget(null);
                        setShowUpsert(true);
                      }}
                      className="inline-flex items-center gap-1 px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700"
                    >
                      <FiPlus className="h-4 w-4" /> Add
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="text-center text-gray-600 py-16 text-sm">
            Loading...
          </div>
        ) : data.length ? (
          <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            <AnimatePresence>
              {data.map((m) => (
                <MedicineCard
                  key={m._id ?? `${m.name}-${m.batchSize}-${m.lastProduced}`}
                  medicine={m}
                  selected={
                    showDetails &&
                    (selectedMedicine?._id || selectedMedicine?.id) ===
                      (m._id || m.id)
                  }
                  onClick={() => openMedicine(m)}
                  onEdit={() => {
                    setEditTarget(m);
                    setShowUpsert(true);
                  }}
                  onDelete={() => handleDelete(m._id)}
                />
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="mx-auto h-16 w-16 text-gray-400 mb-3">
              <FiPackage className="h-full w-full" />
            </div>
            <h3 className="text-sm font-medium text-gray-900">
              No medicines found
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Try adjusting your search or filters
            </p>
          </div>
        )}
      </div>

      {/* Floating Add Button (mobile) */}
      <button
        onClick={() => {
          setEditTarget(null);
          setShowUpsert(true);
        }}
        className="fixed bottom-5 right-5 inline-flex items-center justify-center h-10 w-10 rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 sm:hidden"
        aria-label="Add medicine"
      >
        <FiPlus className="h-5 w-5" />
      </button>

      {/* Modals */}
      <UpsertMedicineModal
        open={showUpsert}
        onClose={() => setShowUpsert(false)}
        initial={editTarget}
        onSave={handleSave}
      />

      <AnimatePresence>
        {showDetails && selectedMedicine && (
          <MedicineModal
            medicine={selectedMedicine}
            onClose={() => setShowDetails(false)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

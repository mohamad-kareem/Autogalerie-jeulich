"use client";

import { useState, useEffect } from "react";
import {
  FiSearch,
  FiKey,
  FiPlus,
  FiEdit2,
  FiTrash2,
  FiChevronRight,
  FiX,
  FiCheck,
  FiRefreshCw,
} from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "react-hot-toast";

export default function SchlüsselManagement() {
  const [schlussels, setSchlussels] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [form, setForm] = useState({
    car: "",
    schlusselNumber: "",
    notes: "",
  });

  const fetchSchlussels = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/schlussels");
      const { schlussels } = await res.json();
      setSchlussels(schlussels);
      setFiltered(schlussels);
    } catch (e) {
      toast.error("Failed to fetch keys");
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchlussels();
  }, []);

  useEffect(() => {
    setFiltered(
      searchTerm
        ? schlussels.filter((s) =>
            s.car.toLowerCase().includes(searchTerm.toLowerCase())
          )
        : schlussels
    );
  }, [searchTerm, schlussels]);

  const onSearch = (e) => {
    setSearchTerm(e.target.value);
    setSelected(null);
    setIsAdding(false);
    setIsEditing(false);
  };

  const onSelect = (s) => {
    setSelected(s);
    setIsAdding(false);
    setIsEditing(false);
  };

  const onInput = (e) => {
    const { name, value } = e.target;
    setForm((p) => ({ ...p, [name]: value }));
  };

  const startAdd = () => {
    setForm({ car: "", schlusselNumber: "", notes: "" });
    setIsAdding(true);
    setSelected(null);
  };

  const startEdit = () => {
    if (!selected) return;
    setForm({
      car: selected.car,
      schlusselNumber: selected.schlusselNumber,
      notes: selected.notes || "",
    });
    setIsEditing(true);
  };

  const saveNew = async () => {
    if (schlussels.some((s) => s.schlusselNumber === form.schlusselNumber)) {
      toast.error("Schlüsselnummer existiert bereits");
      return;
    }

    try {
      const res = await fetch("/api/schlussels", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const { schlussel } = await res.json();
        setSchlussels((p) => [schlussel, ...p]);
        setFiltered((p) => [schlussel, ...p]);
        setIsAdding(false);
        toast.success("Schlüssel erfolgreich hinzugefügt", {
          style: {
            background: "#4F46E5",
            color: "#fff",
          },
          iconTheme: {
            primary: "#3730A3",
            secondary: "#fff",
          },
        });
      } else {
        throw new Error("Failed to add key");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const saveEdit = async () => {
    if (
      schlussels.some(
        (s) =>
          s.schlusselNumber === form.schlusselNumber && s._id !== selected._id
      )
    ) {
      toast.error("Schlüsselnummer existiert bereits");
      return;
    }

    try {
      const res = await fetch(`/api/schlussels/${selected._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (res.ok) {
        const { schlussel: updated } = await res.json();
        setSchlussels((p) =>
          p.map((s) => (s._id === updated._id ? updated : s))
        );
        setFiltered((p) => p.map((s) => (s._id === updated._id ? updated : s)));
        setSelected(updated);
        setIsEditing(false);
        toast.success("Schlüssel erfolgreich aktualisiert", {
          style: {
            background: "#4F46E5",
            color: "#fff",
          },
          iconTheme: {
            primary: "#3730A3",
            secondary: "#fff",
          },
        });
      } else {
        throw new Error("Failed to update key");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const remove = async (id) => {
    if (!confirm("Möchten Sie diesen Schlüssel wirklich löschen?")) return;
    try {
      const res = await fetch(`/api/schlussels/${id}`, { method: "DELETE" });
      if (res.ok) {
        setSchlussels((p) => p.filter((s) => s._id !== id));
        setFiltered((p) => p.filter((s) => s._id !== id));
        if (selected?._id === id) setSelected(null);
        toast.success("Schlüssel erfolgreich gelöscht", {
          style: {
            background: "#4F46E5",
            color: "#fff",
          },
          iconTheme: {
            primary: "#3730A3",
            secondary: "#fff",
          },
        });
      } else {
        throw new Error("Failed to delete key");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-indigo-50 p-4 md:p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
          </div>
        </div>
      </div>
    );
  }
  {
    /* <div className="min-h-screen bg-gradient-to-br from-green-300 to-green-900 p-4 ">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1750px] mx-auto"></div> */
  }
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-200 to-indigo-500 p-4 md:p-6">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1850px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
          <div>
            <h1 className="text-xl md:text-3xl font-bold text-indigo-900">
              Schlüsselverwaltung
            </h1>
            <p className="text-indigo-600 mt-1">
              {schlussels.length}{" "}
              {schlussels.length === 1 ? "Schlüssel" : "Schlüssel"} registriert
            </p>
          </div>
          <motion.button
            onClick={startAdd}
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
            className="mt-6 md:mt-10 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors flex items-center gap-2 shadow-md"
          >
            <FiPlus className="text-base" />
            Neuer Schlüssel
          </motion.button>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-1 lg:grid-cols-5">
            {/* Search & List */}
            <div className="lg:col-span-3 border-r border-gray-200">
              <div className="p-4 border-b border-gray-200 bg-indigo-50">
                <div className="relative">
                  <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-indigo-400" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={onSearch}
                    placeholder="Nach Fahrzeug suchen..."
                    className="pl-10 pr-4 py-3 w-full border border-indigo-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all duration-200 bg-white shadow-sm"
                  />
                </div>
              </div>
              <div
                className="overflow-y-auto"
                style={{ maxHeight: "calc(100vh - 220px)" }}
              >
                {filtered.length === 0 ? (
                  <div className="p-8 text-center">
                    <div className="text-indigo-300 mb-3">
                      <FiKey className="inline-block text-4xl" />
                    </div>
                    <p className="text-gray-600 font-medium">
                      {searchTerm
                        ? "Keine passenden Schlüssel gefunden"
                        : "Keine Schlüssel vorhanden"}
                    </p>
                    {!searchTerm && (
                      <motion.button
                        onClick={startAdd}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="mt-4 text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center justify-center gap-1 mx-auto px-4 py-2 rounded-lg bg-indigo-50"
                      >
                        <FiPlus /> Ersten Schlüssel hinzufügen
                      </motion.button>
                    )}
                  </div>
                ) : (
                  <ul className="divide-y divide-gray-200">
                    {filtered.map((s) => (
                      <motion.li
                        key={s._id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.2 }}
                        onClick={() => onSelect(s)}
                        className={`px-4 py-4 cursor-pointer transition-all hover:bg-indigo-50 flex justify-between items-center ${
                          selected?._id === s._id
                            ? "bg-indigo-50 border-l-4 border-indigo-500"
                            : ""
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className={`p-2 rounded-lg ${
                              selected?._id === s._id
                                ? "bg-indigo-100 text-indigo-600"
                                : "bg-gray-100 text-gray-600"
                            }`}
                          >
                            <FiKey className="text-lg" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-800">
                              {s.car}
                            </h3>
                            <p className="text-xs text-gray-500">
                              Schlüssel #{s.schlusselNumber}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              remove(s._id);
                            }}
                            className="text-gray-400 hover:text-indigo-500 p-1 rounded-full hover:bg-gray-100 transition-colors"
                          >
                            <FiTrash2 className="text-sm" />
                          </button>
                          <FiChevronRight className="text-gray-400" />
                        </div>
                      </motion.li>
                    ))}
                  </ul>
                )}
              </div>
            </div>

            {/* Detail / Form */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {isAdding || isEditing ? (
                  <motion.div
                    key="form"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-lg font-semibold text-gray-800">
                        {isEditing
                          ? "Schlüssel bearbeiten"
                          : "Neuen Schlüssel hinzufügen"}
                      </h2>

                      <button
                        onClick={() => {
                          setIsAdding(false);
                          setIsEditing(false);
                        }}
                        className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
                      >
                        <FiX className="text-lg" />
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Fahrzeugname{" "}
                          <span className="text-indigo-500">*</span>
                        </label>
                        <input
                          name="car"
                          value={form.car}
                          onChange={onInput}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                          placeholder="z.B. BMW X5"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Schlüsselnummer{" "}
                          <span className="text-indigo-500">*</span>
                        </label>
                        <input
                          name="schlusselNumber"
                          value={form.schlusselNumber}
                          onChange={onInput}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                          placeholder="z.B. 12345"
                          required
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Zusätzliche Hinweise
                        </label>
                        <textarea
                          name="notes"
                          value={form.notes}
                          onChange={onInput}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent text-sm transition-all"
                          rows={3}
                          placeholder="Spezielle Anweisungen…"
                        />
                      </div>

                      <div className="flex justify-end gap-3 pt-3">
                        <button
                          onClick={() => {
                            setIsAdding(false);
                            setIsEditing(false);
                          }}
                          className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium transition-colors"
                        >
                          Abbrechen
                        </button>
                        <button
                          onClick={isEditing ? saveEdit : saveNew}
                          className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 text-sm font-medium transition-colors flex items-center gap-2 shadow-md"
                        >
                          <FiCheck className="text-base" />
                          {isEditing ? "Speichern" : "Hinzufügen"}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : selected ? (
                  <motion.div
                    key="details"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-6"
                  >
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h2 className="text-xl font-bold text-gray-800 flex items-center gap-3">
                          <span className="p-3 bg-indigo-100 text-indigo-600 rounded-lg">
                            <FiKey />
                          </span>
                          {selected.car}
                        </h2>
                        <p className="text-xs text-gray-500 mt-1">
                          Hinzugefügt am{" "}
                          {new Date(selected.createdAt).toLocaleDateString(
                            "de-DE"
                          )}
                        </p>
                      </div>
                      <button
                        onClick={startEdit}
                        className="text-indigo-400 hover:text-indigo-600 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                      >
                        <FiEdit2 className="text-lg" />
                      </button>
                    </div>

                    <div className="space-y-5">
                      <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-100">
                        <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">
                          Schlüsselnummer
                        </h3>
                        <p className="text-xl font-bold text-gray-800">
                          {selected.schlusselNumber}
                        </p>
                      </div>

                      {selected.notes && (
                        <div>
                          <h3 className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-2">
                            Hinweise
                          </h3>
                          <p className="text-gray-800 whitespace-pre-line bg-indigo-50 p-4 rounded-xl text-sm border border-indigo-100">
                            {selected.notes}
                          </p>
                        </div>
                      )}

                      <div className="pt-3 border-t border-gray-200">
                        <button
                          onClick={() => remove(selected._id)}
                          className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-2 transition-colors px-3 py-2 rounded-lg hover:bg-indigo-50"
                        >
                          <FiTrash2 className="text-sm" />
                          Schlüssel löschen
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="h-full flex flex-col items-center justify-center p-6 text-center"
                  >
                    <div className="p-4 bg-indigo-100 text-indigo-400 rounded-full mb-4">
                      <FiKey className="text-3xl" />
                    </div>
                    <h3 className="text-lg font-medium text-gray-700 mb-1">
                      {searchTerm
                        ? "Wählen Sie einen Schlüssel aus"
                        : "Kein Schlüssel ausgewählt"}
                    </h3>
                    <p className="text-gray-500 text-sm max-w-xs mb-4">
                      {searchTerm
                        ? "Wählen Sie einen Eintrag aus den Suchergebnissen, um Details anzuzeigen"
                        : "Wählen Sie einen Schlüssel aus der Liste oder fügen Sie einen neuen hinzu"}
                    </p>

                    {!searchTerm && (
                      <motion.button
                        onClick={startAdd}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.98 }}
                        className="text-indigo-600 hover:text-indigo-700 text-sm font-medium flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-50"
                      >
                        <FiPlus /> Neuen Schlüssel hinzufügen
                      </motion.button>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

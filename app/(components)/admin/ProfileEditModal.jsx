"use client";

import React, { useState, useRef, useEffect } from "react";
import {
  FiX,
  FiCamera,
  FiSun,
  FiMoon,
  FiUser,
  FiShield,
  FiLogOut,
} from "react-icons/fi";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { signOut } from "next-auth/react";

const SettingsModal = ({
  user,
  darkMode,
  onClose,
  onToggleDarkMode,
  onSave,
}) => {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("profile");

  const [formData, setFormData] = useState({
    name: user?.name || "",
    image: user?.image || "",
  });

  const [previewImage, setPreviewImage] = useState(
    user?.image || "/default-avatar.png"
  );

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    setFormData({
      name: user?.name || "",
      image: user?.image || "",
    });
    setPreviewImage(user?.image || "/default-avatar.png");
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewImage(reader.result);
      setFormData((prev) => ({ ...prev, image: reader.result }));
    };
    reader.readAsDataURL(file);
  };

  const triggerFileInput = () => fileInputRef.current?.click();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const adminId = user?._id || user?.id;

      if (!adminId) {
        toast.error("Admin-ID fehlt!");
        return;
      }

      const response = await fetch(`/api/admins/${adminId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          image: formData.image,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => null);
        throw new Error(
          err?.error || "Profil konnte nicht aktualisiert werden"
        );
      }

      const updatedUser = await response.json();
      onSave(updatedUser);

      toast.success("Profil erfolgreich aktualisiert!");
    } catch (error) {
      toast.error(error.message || "Es ist ein Fehler aufgetreten");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = () => {
    onClose();
    router.push("/forgotpassword");
  };

  const handleDarkModeToggle = () => {
    onToggleDarkMode();
    window.location.reload();
  };

  const tabs = [
    { id: "profile", label: "Profil", icon: <FiUser className="h-4 w-4" /> },
    {
      id: "appearance",
      label: "Aussehen",
      icon: darkMode ? (
        <FiMoon className="h-4 w-4" />
      ) : (
        <FiSun className="h-4 w-4" />
      ),
    },
    {
      id: "security",
      label: "Sicherheit",
      icon: <FiShield className="h-4 w-4" />,
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-5">
            {/* Profile Header */}
            <div className="flex flex-col items-center">
              <div className="relative mb-3">
                <div className="rounded-full bg-gradient-to-tr from-blue-500 to-purple-600 p-1">
                  <img
                    src={previewImage || "/default-avatar.png"}
                    alt={user?.name || "Profilbild"}
                    className="h-20 w-20 sm:h-24 sm:w-24 rounded-full object-cover bg-white"
                  />
                </div>

                <button
                  type="button"
                  onClick={triggerFileInput}
                  className="absolute bottom-1 right-1 rounded-full bg-gray-900 p-2 text-white shadow-lg hover:bg-black transition"
                  aria-label="Profilbild ändern"
                >
                  <FiCamera className="h-4 w-4" />
                </button>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                {formData.name || "Benutzer"}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 truncate max-w-[220px] sm:max-w-none">
                {user?.email}
              </p>
            </div>

            {/* Profile Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Vollständiger Name
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Ihr Name"
                />
              </div>

              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  E-Mail
                </label>
                <input
                  type="email"
                  value={user?.email || ""}
                  readOnly
                  className="w-full rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 text-sm text-gray-500 cursor-not-allowed"
                />
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-blue-700 transition disabled:opacity-50"
              >
                {saving ? "Speichern..." : "Speichern"}
              </button>
            </form>
          </div>
        );

      case "appearance":
        return (
          <div className="space-y-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Theme
            </h3>

            <div
              className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition cursor-pointer"
              onClick={handleDarkModeToggle}
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg ${
                    darkMode ? "bg-gray-900" : "bg-blue-100"
                  }`}
                >
                  {darkMode ? (
                    <FiMoon className="h-5 w-5 text-yellow-400" />
                  ) : (
                    <FiSun className="h-5 w-5 text-blue-600" />
                  )}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">
                    {darkMode ? "Dunkelmodus" : "Hellmodus"}
                  </p>
                  <p className="text-xs text-gray-500">
                    Wechseln Sie das Design
                  </p>
                </div>
              </div>

              <div
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  darkMode ? "bg-blue-600" : "bg-gray-300"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                    darkMode ? "translate-x-6" : "translate-x-1"
                  }`}
                />
              </div>
            </div>
          </div>
        );

      case "security":
        return (
          <div className="space-y-5">
            <h3 className="text-base sm:text-lg font-semibold text-gray-900">
              Sicherheit
            </h3>

            <button
              onClick={handleChangePassword}
              className="w-full text-left p-4 rounded-lg border border-gray-200 hover:bg-gray-100 transition"
            >
              <p className="font-semibold text-sm text-gray-900">
                Passwort zurücksetzen
              </p>
              <p className="text-xs text-gray-500 mt-1">
                Neues sicheres Passwort erstellen
              </p>
            </button>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-3 sm:px-4">
      <div className="w-full max-w-4xl max-h-[90vh] flex flex-col md:flex-row overflow-hidden rounded-2xl bg-white shadow-2xl">
        {/* LEFT MENU */}
        <div className="w-full md:w-64 border-b md:border-b-0 md:border-r border-gray-200 bg-gray-50 p-4 sm:p-6">
          <div className="mb-4 sm:mb-6">
            <h2 className="text-lg sm:text-xl font-bold text-gray-900">
              Einstellungen
            </h2>
            <p className="text-xs sm:text-sm text-gray-500 mt-1">
              Kontoeinstellungen verwalten
            </p>
          </div>

          <nav className="space-y-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-3 w-full p-3 rounded-lg text-sm font-semibold transition ${
                  activeTab === tab.id
                    ? "bg-blue-50 text-blue-700 border border-blue-100"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}

            {/* LOGOUT */}
            <div className="pt-3 mt-3 border-t border-gray-200">
              <button
                onClick={() => signOut({ callbackUrl: "/" })}
                className="flex items-center gap-3 w-full p-3 rounded-lg text-sm font-bold text-red-600 hover:bg-red-50 transition"
              >
                <FiLogOut className="h-4 w-4" />
                Abmelden
              </button>
            </div>
          </nav>
        </div>

        {/* RIGHT CONTENT */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8">
          <div className="flex items-start justify-between gap-3 mb-6">
            <div className="min-w-0">
              <h3 className="text-lg sm:text-2xl font-bold text-gray-900">
                {tabs.find((t) => t.id === activeTab)?.label}
              </h3>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {activeTab === "profile" &&
                  "Bearbeiten Sie Ihr Profil und persönliche Informationen"}
                {activeTab === "appearance" && "Passen Sie das Design an"}
                {activeTab === "security" && "Verwalten Sie Sicherheit"}
              </p>
            </div>

            <button
              onClick={onClose}
              className="p-2 hover:bg-gray-100 rounded-lg transition"
              aria-label="Schließen"
            >
              <FiX className="h-5 w-5 text-gray-500" />
            </button>
          </div>

          <div className="max-w-2xl">{renderTabContent()}</div>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;

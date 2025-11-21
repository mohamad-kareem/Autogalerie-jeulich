"use client";

import React, { useState, useRef } from "react";
import { FiX, FiCamera } from "react-icons/fi";
import toast from "react-hot-toast";

const ProfileEditModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name || "",
    image: user.image || "",
  });

  const [previewImage, setPreviewImage] = useState(
    user.image || "/default-avatar.png"
  );

  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);

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

  const triggerFileInput = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);

    try {
      const response = await fetch(`/api/admins`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: user._id,
          name: formData.name,
          image: formData.image,
        }),
      });

      if (!response.ok) {
        throw new Error("Profil konnte nicht aktualisiert werden");
      }

      const updatedUser = await response.json();
      onSave(updatedUser);
      toast.success("Profil erfolgreich aktualisiert!");
      onClose();
    } catch (error) {
      toast.error(error.message || "Es ist ein Fehler aufgetreten");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 backdrop-blur-sm px-3 sm:px-4">
      <div className="w-full max-w-lg rounded-2xl bg-white shadow-2xl border border-slate-200/80 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 border-b border-slate-100">
          <h3 className="text-base sm:text-lg font-semibold text-slate-900">
            Profil bearbeiten
          </h3>
          <button
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            aria-label="Schließen"
          >
            <FiX className="h-4 w-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="px-4 sm:px-6 py-4 sm:py-5">
          {/* Avatar */}
          <div className="mb-5 sm:mb-6 flex flex-col items-center">
            <div className="relative">
              <div className="rounded-full bg-gradient-to-tr from-slate-600 to-slate-900 p-[2px]">
                <img
                  src={previewImage || "/default-avatar.png"}
                  alt={user.name || "Profilbild"}
                  className="h-16 w-16 sm:h-20 sm:w-20 rounded-full object-cover bg-slate-100"
                />
              </div>

              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 rounded-full bg-slate-600 p-1.5 sm:p-2 text-white shadow-lg transition-all hover:bg-slate-700 hover:scale-105"
                aria-label="Profilbild ändern"
              >
                <FiCamera className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              </button>
            </div>

            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />

            <p className="mt-2 text-[11px] sm:text-xs text-slate-500 text-center">
              JPG oder PNG, idealerweise quadratisch.
            </p>
          </div>

          {/* Fields */}
          <div className="space-y-4 sm:space-y-5">
            {/* Name */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-700">
                Vollständiger Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:text-base text-slate-900 bg-white shadow-sm focus:outline-none focus:ring-2 focus:ring-slate-500/70 focus:border-slate-500 transition-all"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="mb-1.5 block text-xs sm:text-sm font-medium text-slate-700">
                E-Mail
              </label>
              <input
                type="email"
                value={user.email || ""}
                readOnly
                className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm sm:text-base text-slate-500 bg-slate-50 cursor-not-allowed"
              />
              <p className="mt-1 text-[11px] sm:text-xs text-slate-500">
                Für eine Änderung der E-Mail-Adresse wenden Sie sich bitte an
                den Support.
              </p>
            </div>
          </div>

          {/* Footer buttons */}
          <div className="mt-6 sm:mt-7 flex justify-end gap-2.5 sm:gap-3 border-t border-slate-100 pt-3.5 sm:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-slate-700 hover:bg-slate-50 hover:shadow-sm transition-all"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center justify-center rounded-lg bg-gradient-to-r from-slate-600 to-slate-800 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium text-white shadow-md hover:shadow-lg hover:brightness-110 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {saving ? "Speichern..." : "Änderungen speichern"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;

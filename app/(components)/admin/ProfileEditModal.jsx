"use client";

import React, { useState, useRef } from "react";
import { FiX, FiCamera } from "react-icons/fi";
import toast from "react-hot-toast";

const ProfileEditModal = ({ user, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: user.name,
    image: user.image,
  });
  const [previewImage, setPreviewImage] = useState(user.image);
  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
        setFormData((prev) => ({ ...prev, image: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      onClose();
      toast.success("Profil erfolgreich aktualisiert!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-in rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b pb-3 md:pb-4">
          <h3 className="text-lg md:text-xl font-semibold text-gray-900">
            Profil bearbeiten
          </h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <FiX className="h-4 w-4 md:h-5 md:w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 md:mt-6">
          <div className="mb-4 md:mb-6 flex flex-col items-center">
            <div className="relative">
              <img
                src={previewImage || "/default-avatar.jpg"}
                alt="Profilbild"
                className="h-20 w-20 md:h-24 md:w-24 rounded-full object-cover shadow-lg ring-2 md:ring-4 ring-white/80"
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-1.5 md:p-2 text-white shadow-lg transition-all hover:bg-indigo-700 hover:scale-105 md:hover:scale-110"
              >
                <FiCamera className="h-3 w-3 md:h-4 md:w-4" />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
          </div>

          <div className="space-y-3 md:space-y-4">
            <div>
              <label className="mb-1 block text-xs md:text-sm font-medium text-gray-700">
                Vollständiger Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg md:rounded-xl border border-gray-200 px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-xs md:text-sm font-medium text-gray-700">
                E-Mail
              </label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full cursor-not-allowed rounded-lg md:rounded-xl border border-gray-200 bg-gray-50 px-3 py-1.5 md:px-4 md:py-2 text-sm md:text-base"
              />
              <p className="mt-1 text-xs text-gray-500">
                Kontaktieren Sie den Support, um die E-Mail-Adresse zu ändern
              </p>
            </div>
          </div>

          <div className="mt-6 md:mt-8 flex justify-end space-x-2 md:space-x-3 border-t pt-3 md:pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg md:rounded-xl border border-gray-200 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-gray-700 transition-all hover:bg-gray-50 hover:shadow-sm"
            >
              Abbrechen
            </button>
            <button
              type="submit"
              className="rounded-lg md:rounded-xl bg-gradient-to-r from-indigo-600 to-blue-500 px-3 py-1.5 md:px-4 md:py-2 text-xs md:text-sm text-white shadow-md transition-all hover:shadow-lg hover:brightness-105"
            >
              Änderungen speichern
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfileEditModal;

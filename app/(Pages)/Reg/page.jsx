"use client";

import { useState } from "react";
import {
  FiUser,
  FiMail,
  FiLock,
  FiCamera,
  FiArrowRight,
  FiMenu,
} from "react-icons/fi";
import { motion } from "framer-motion";
import { useSidebar } from "@/app/(components)/SidebarContext";

export default function RegistrationPage() {
  const { openSidebar } = useSidebar();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    image: null,
    role: "admin",
  });

  const [previewImage, setPreviewImage] = useState(null);
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files?.[0] || null;
      setFormData((prev) => ({ ...prev, image: file }));

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => setPreviewImage(reader.result);
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
      }
    } else {
      setFormData((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setMessage({ text: "", type: "" });

    const data = new FormData();
    data.append("name", formData.name.trim());
    data.append("email", formData.email.toLowerCase().trim());
    data.append("password", formData.password);
    data.append("role", formData.role);
    if (formData.image) data.append("image", formData.image);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        body: data,
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Registration failed");

      setMessage({
        text: "Account created successfully. You can now sign in.",
        type: "success",
      });

      setFormData({
        name: "",
        email: "",
        password: "",
        image: null,
        role: "admin",
      });
      setPreviewImage(null);
    } catch (err) {
      setMessage({
        text: err.message || "Registration error",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = () => {
    setFormData((prev) => ({ ...prev, image: null }));
    setPreviewImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-slate-950 flex items-center justify-center px-4 py-10 relative">
      {/* 🔹 FIXED MENU BUTTON – OUTSIDE */}
      <button
        onClick={openSidebar}
        className="fixed top-4 left-4 z-50 p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-white md:hidden"
        aria-label="Menü öffnen"
      >
        <FiMenu className="w-4 h-4" />
      </button>

      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-md bg-gray-900/60 backdrop-blur-md border border-gray-800 rounded-xl shadow-xl"
      >
        <div className="p-6">
          <h1 className="text-xl font-semibold text-gray-200">
            Admin-Konto erstellen
          </h1>
          <p className="text-sm text-gray-400 mb-5">
            Administrator-Zugang anlegen
          </p>

          {message.text && (
            <div
              className={`mb-4 text-sm p-3 rounded-md border ${
                message.type === "success"
                  ? "bg-green-900/20 text-green-300 border-green-800"
                  : "bg-slate-900/20 text-slate-300 border-slate-800"
              }`}
            >
              {message.text}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Avatar */}
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-full bg-gray-800 border border-gray-700 overflow-hidden flex items-center justify-center">
                {previewImage ? (
                  <img
                    src={previewImage}
                    alt="Preview"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <FiCamera className="text-gray-500" />
                )}
              </div>

              <div className="flex gap-2">
                <label className="cursor-pointer text-xs px-3 py-1.5 rounded-md bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700">
                  {previewImage ? "Ändern" : "Upload"}
                  <input
                    type="file"
                    name="image"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>

                {previewImage && (
                  <button
                    type="button"
                    onClick={removeImage}
                    className="text-xs px-3 py-1.5 rounded-md bg-gray-800 border border-gray-700 text-gray-300 hover:bg-gray-700"
                  >
                    Löschen
                  </button>
                )}
              </div>
            </div>

            {/* Name */}
            <Input
              icon={<FiUser />}
              placeholder="Voller Name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />

            {/* Email */}
            <Input
              icon={<FiMail />}
              placeholder="E-Mail-Adresse"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              required
            />

            {/* Password */}
            <Input
              icon={<FiLock />}
              placeholder="Passwort (min. 8 Zeichen)"
              name="password"
              type="password"
              value={formData.password}
              onChange={handleChange}
              minLength={8}
              required
            />

            {/* Role */}
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full bg-gray-800 border border-gray-700 rounded-md px-3 py-2 text-sm text-gray-200 focus:ring-2 focus:ring-slate-500"
            >
              <option value="admin">Administrator</option>
              <option value="user">Benutzer</option>
            </select>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-md bg-slate-600 hover:bg-slate-700 text-white text-sm font-medium transition disabled:opacity-60"
            >
              {isSubmitting ? "Erstellen..." : "Konto erstellen"}
              <FiArrowRight />
            </button>
          </form>
        </div>
      </motion.div>
    </div>
  );
}

/* 🔹 Small reusable input */
function Input({ icon, ...props }) {
  return (
    <div className="relative">
      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500">
        {icon}
      </span>
      <input
        {...props}
        className="w-full pl-10 pr-3 py-2 bg-gray-800 border border-gray-700 rounded-md text-sm text-gray-200 placeholder-gray-500 focus:ring-2 focus:ring-slate-500"
      />
    </div>
  );
}

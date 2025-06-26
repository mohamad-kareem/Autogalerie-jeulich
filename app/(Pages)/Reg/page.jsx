"use client";
import { useState } from "react";
import {
  FiUser,
  FiMail,
  FiLock,
  FiCamera,
  FiCheck,
  FiX,
  FiArrowLeft,
} from "react-icons/fi";
import Link from "next/link";

export default function RegistrierungsSeite() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    image: null,
    role: "admin",
  });
  const [message, setMessage] = useState({ text: "", type: "" });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);

  const handleChange = (e) => {
    const { name, value, files } = e.target;

    if (name === "image") {
      const file = files[0];
      setFormData({ ...formData, image: file });

      if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setPreviewImage(reader.result);
        };
        reader.readAsDataURL(file);
      } else {
        setPreviewImage(null);
      }
    } else {
      setFormData({ ...formData, [name]: value });
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

      if (!res.ok)
        throw new Error(result.message || "Registrierung fehlgeschlagen");

      setMessage({
        text: "Registrierung erfolgreich! Sie können sich jetzt anmelden.",
        type: "success",
      });
      setFormData({ name: "", email: "", password: "", image: null });
      setPreviewImage(null);
    } catch (err) {
      setMessage({
        text: err.message || "Bei der Registrierung ist ein Fehler aufgetreten",
        type: "error",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeImage = () => {
    setFormData({ ...formData, image: null });
    setPreviewImage(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-100 to-black/90 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Link
          href="/AdminDashboard"
          className="flex items-center text-red-700 hover:text-red-800 mb-4"
        >
          <FiArrowLeft className="mr-2" />
          Zurück zum Dashboard
        </Link>

        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="bg-gradient-to-br from-red-600 to-black p-6 text-center">
            <h1 className="text-2xl font-bold text-white">
              Administrator-Registrierung
            </h1>
            <p className="text-red-100 mt-1">
              Erstellen Sie Ihren Administrator-Account
            </p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Name Field */}
            <div className="space-y-2">
              <label
                htmlFor="name"
                className="block text-sm font-medium text-gray-700"
              >
                Vollständiger Name
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="text-red-500" />
                </div>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleChange}
                  required
                  placeholder="Max Mustermann"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>
            </div>

            {/* Email Field - Fixed width issue */}
            <div className="space-y-2">
              <label
                htmlFor="email"
                className="block text-sm font-medium text-gray-700"
              >
                E-Mail-Adresse
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="text-red-500" />
                </div>
                <input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleChange}
                  required
                  placeholder="max@beispiel.de"
                  className="w-full min-w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                  style={{ minWidth: "100%" }}
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="space-y-2">
              <label
                htmlFor="password"
                className="block text-sm font-medium text-gray-700"
              >
                Passwort
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="text-red-500" />
                </div>
                <input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleChange}
                  required
                  minLength="8"
                  placeholder="••••••••"
                  className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
                />
              </div>
              <p className="text-xs text-gray-500 mt-1">Mindestens 8 Zeichen</p>
            </div>

            {/* Role Selection */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Rolle
              </label>
              <select
                name="role"
                value={formData.role}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all"
              >
                <option value="admin">Administrator</option>
                <option value="user">Benutzer</option>
              </select>
            </div>

            {/* Image Upload */}
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Profilbild (Optional)
              </label>
              {previewImage ? (
                <div className="relative mt-2">
                  <img
                    src={previewImage}
                    alt="Vorschau"
                    className="h-32 w-32 rounded-full object-cover mx-auto border-2 border-red-300"
                  />
                  <button
                    type="button"
                    onClick={removeImage}
                    className="absolute top-0 right-0 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                    aria-label="Bild entfernen"
                  >
                    <FiX size={14} />
                  </button>
                </div>
              ) : (
                <label className="flex flex-col items-center justify-center w-full p-6 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-red-500 hover:bg-red-50 transition-colors">
                  <div className="flex flex-col items-center justify-center">
                    <FiCamera className="text-red-500 text-2xl mb-2" />
                    <p className="text-sm text-gray-600">
                      Zum Hochladen klicken
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      PNG, JPG bis zu 2MB
                    </p>
                  </div>
                  <input
                    id="image"
                    name="image"
                    type="file"
                    accept="image/*"
                    onChange={handleChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-all shadow-md ${
                isSubmitting
                  ? "bg-red-600 cursor-not-allowed"
                  : "bg-gradient-to-br from-red-600 to-black hover:from-red-600 hover:to-red-700"
              }`}
            >
              {isSubmitting ? (
                <span className="flex items-center justify-center">
                  <svg
                    className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Wird verarbeitet...
                </span>
              ) : (
                "Account registrieren"
              )}
            </button>

            {/* Message */}
            {message.text && (
              <div
                className={`p-3 rounded-lg ${
                  message.type === "success"
                    ? "bg-green-100 text-green-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                <div className="flex items-center">
                  {message.type === "success" ? (
                    <FiCheck className="mr-2" />
                  ) : (
                    <FiX className="mr-2" />
                  )}
                  <span>{message.text}</span>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
}

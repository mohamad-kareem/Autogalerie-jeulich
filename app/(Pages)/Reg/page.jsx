"use client";
import { useState } from "react";
import {
  FiUser,
  FiMail,
  FiLock,
  FiCamera,
  FiArrowRight,
  FiX,
} from "react-icons/fi";
import Link from "next/link";
import { motion } from "framer-motion";

export default function RegistrationPage() {
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
        reader.onloadend = () => setPreviewImage(reader.result);
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

      if (!res.ok) throw new Error(result.message || "Registration failed");

      setMessage({
        text: "Account created successfully! You can now sign in.",
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
        text: err.message || "An error occurslate during registration",
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
    <div className="min-h-screen bg-gradient-to-br from-gray-950 to-slate-950 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="bg-gray-900/60 backdrop-blur-md rounded-xl border border-gray-800 overflow-hidden shadow-2xl"
        >
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-200">
                Admin-Konto erstellen
              </h1>
              <p className="text-gray-400 mt-1">
                Richten Sie Ihre Administratoranmeldeinformationen ein
              </p>
            </div>

            {message.text && (
              <motion.div
                initial={{ y: -10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className={`mb-6 p-3 rounded-md border text-sm ${
                  message.type === "success"
                    ? "bg-green-900/20 text-green-300 border-green-800/50"
                    : "bg-slate-900/20 text-slate-300 border-slate-800/50"
                }`}
              >
                {message.text}
              </motion.div>
            )}

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Profilbild
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gray-800 overflow-hidden border border-gray-700">
                    {previewImage ? (
                      <img
                        className="h-full w-full object-cover"
                        src={previewImage}
                        alt="Preview"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-500">
                        <FiCamera className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center px-3 py-2 border border-gray-700 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors">
                        {previewImage ? "ändern" : "hochladen"}
                      </span>
                      <input
                        type="file"
                        name="image"
                        accept="image/*"
                        onChange={handleChange}
                        className="sr-only"
                      />
                    </label>
                    {previewImage && (
                      <button
                        type="button"
                        onClick={removeImage}
                        className="ml-3 inline-flex items-center px-3 py-2 border border-gray-700 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-300 bg-gray-800 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors"
                      >
                        löschen
                      </button>
                    )}
                    <p className="mt-1 text-xs text-gray-500">
                      PNG, JPG bis zu 2MB
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <label
                  htmlFor="name"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  voller Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-500" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="Thomas Müller"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-500" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    requislate
                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="admin@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Passwort
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-500" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    requislate
                    minLength="8"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-slate-500 focus:border-slate-500 transition-colors"
                    placeholder="••••••••"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">
                  mindestens 8-stellig
                </p>
              </div>

              <div>
                <label
                  htmlFor="role"
                  className="block text-sm font-medium text-gray-300 mb-1"
                >
                  Rolle
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-700 rounded-md shadow-sm bg-gray-800 text-gray-200 focus:outline-none focus:ring-slate-500 focus:border-slate-500 transition-colors"
                >
                  <option value="admin" className="bg-gray-800">
                    Administrator
                  </option>
                  <option value="user" className="bg-gray-800">
                    benutzer
                  </option>
                </select>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-600 hover:bg-slate-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 transition-colors ${
                    isSubmitting ? "opacity-75 cursor-not-allowed" : ""
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg
                        className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
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
                      Konto erstellen...
                    </>
                  ) : (
                    <>
                      Konto erstellen <FiArrowRight className="ml-2" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </motion.div>
      </div>

      {/* Background Glow */}
      <div className="fixed inset-0 -z-10 pointer-events-none">
        <div className="absolute top-0 left-1/3 w-60 h-60 bg-slate-500/10 blur-3xl rounded-full" />
        <div className="absolute bottom-0 right-1/3 w-60 h-60 bg-purple-500/10 blur-3xl rounded-full" />
      </div>
    </div>
  );
}

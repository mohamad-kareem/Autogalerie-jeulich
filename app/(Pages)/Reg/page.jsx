"use client";
import { useState } from "react";
import { FiUser, FiMail, FiLock, FiCamera, FiArrowRight } from "react-icons/fi";
import Link from "next/link";

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
        text: err.message || "An error occurred during registration",
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="w-full max-w-2xl">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-8">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                Admin-Konto erstellen
              </h1>
              <p className="text-gray-600 mt-1">
                Richten Sie Ihre Administratoranmeldeinformationen ein
              </p>
            </div>

            {message.text && (
              <div
                className={`mb-6 p-3 rounded-md text-sm ${
                  message.type === "success"
                    ? "bg-green-50 text-green-700"
                    : "bg-red-50 text-red-700"
                }`}
              >
                {message.text}
              </div>
            )}

            <form
              onSubmit={handleSubmit}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Profilbild
                </label>
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0 h-16 w-16 rounded-full bg-gray-200 overflow-hidden border border-gray-300">
                    {previewImage ? (
                      <img
                        className="h-full w-full object-cover"
                        src={previewImage}
                        alt="Preview"
                      />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-gray-400">
                        <FiCamera className="h-6 w-6" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1">
                    <label className="cursor-pointer">
                      <span className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
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
                        className="ml-3 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
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
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  voller Name
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="text-gray-400" />
                  </div>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Thomas Müller"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  E-Mail-Adresse
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="text-gray-400" />
                  </div>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    required
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="admin@company.com"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Passwort
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="text-gray-400" />
                  </div>
                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength="8"
                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Rolle
                </label>
                <select
                  id="role"
                  name="role"
                  value={formData.role}
                  onChange={handleChange}
                  className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="admin">Administrator</option>
                  <option value="user">benutzer</option>
                </select>
              </div>

              <div className="md:col-span-2 pt-2">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full flex justify-center items-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 ${
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
        </div>
      </div>
    </div>
  );
}

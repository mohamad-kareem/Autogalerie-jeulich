// app/(Pages)/AdminDashboard/page.jsx
"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import {
  FiPlus,
  FiBook,
  FiFileText,
  FiKey,
  FiCheckSquare,
  FiUserPlus,
  FiEdit,
  FiX,
  FiClock,
  FiCamera,
  FiMapPin,
  FiCalendar,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";

const NavigationCard = ({ href, icon, title, description, accentColor }) => {
  const colorMap = {
    red: "bg-red-100 text-red-700",
    green: "bg-green-100 text-green-700",
    blue: "bg-blue-100 text-blue-700",
    yellow: "bg-yellow-100 text-yellow-700",
    orange: "bg-orange-100 text-orange-700",
    indigo: "bg-indigo-100 text-indigo-700",
    purple: "bg-purple-100 text-purple-700",
    pink: "bg-pink-100 text-pink-700",
    teal: "bg-teal-100 text-teal-700",
    cyan: "bg-cyan-100 text-cyan-700",
    lime: "bg-lime-100 text-lime-700",
    amber: "bg-amber-100 text-amber-700",
    rose: "bg-rose-100 text-rose-700",
    sky: "bg-sky-100 text-sky-700",
    slate: "bg-slate-100 text-slate-700",
    gray: "bg-gray-100 text-gray-700",
    zinc: "bg-zinc-100 text-zinc-700",
    neutral: "bg-neutral-100 text-neutral-700",
    stone: "bg-stone-100 text-stone-700",
  };

  const gradientMap = {
    red: "from-red-400 to-red-300",
    green: "from-green-400 to-green-300",
    blue: "from-blue-400 to-blue-200",
    yellow: "from-yellow-400 to-yellow-300",
    orange: "from-orange-400 to-orange-300",
    indigo: "from-indigo-400 to-indigo-300",
    purple: "from-purple-400 to-purple-300",
    pink: "from-pink-400 to-pink-300",
    teal: "from-teal-400 to-teal-300",
    cyan: "from-cyan-400 to-cyan-300",
    lime: "from-lime-400 to-lime-300",
    amber: "from-amber-400 to-amber-300",
    rose: "from-rose-400 to-rose-300",
    sky: "from-sky-400 to-sky-300",
    slate: "from-slate-400 to-slate-300",
    gray: "from-gray-400 to-gray-300",
    zinc: "from-zinc-400 to-zinc-300",
    neutral: "from-neutral-400 to-neutral-300",
    stone: "from-stone-400 to-stone-300",
  };

  return (
    <Link href={href} passHref>
      <div
        className={`group relative h-full overflow-hidden rounded-xl md:rounded-2xl bg-gradient-to-br ${gradientMap[accentColor]} p-4 md:p-5 shadow-sm transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 md:hover:-translate-y-1`}
      >
        <div className="relative z-10 flex items-start">
          <div
            className={`mr-3 md:mr-4 rounded-lg md:rounded-xl p-2 md:p-3 ${colorMap[accentColor]} transition-all group-hover:scale-105 md:group-hover:scale-110`}
          >
            {React.cloneElement(icon, { className: "text-sm md:text-base" })}
          </div>
          <div className="flex-1">
            <h3 className="text-sm md:text-lg font-semibold text-gray-800">
              {title}
            </h3>
            <p className="mt-1 text-xs md:text-sm text-gray-600 line-clamp-2">
              {description}
            </p>
            <div className="mt-2 md:mt-3 flex items-center text-xs md:text-sm font-medium text-gray-500 transition-colors group-hover:text-gray-700">
              <span>Modul öffnen</span>
              <FiChevronRight className="ml-0.5 md:ml-1 transition-transform group-hover:translate-x-0.5 md:group-hover:translate-x-1" />
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
};

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
                src={previewImage || "/default-avatar.png"}
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

export default function Dashboard() {
  const { data: session } = useSession();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProfileModal, setShowProfileModal] = useState(false);

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        if (!session?.user?.id) return;

        const response = await fetch(`/api/admins?id=${session.user.id}`);
        if (!response.ok) {
          throw new Error("Admin-Daten konnten nicht geladen werden");
        }

        const adminData = await response.json();
        setUser({
          ...adminData,
          role: "Administrator",
        });
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAdminData();
  }, [session]);

  const handleSaveProfile = (updatedData) => {
    setUser((prev) => ({ ...prev, ...updatedData }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center">
          <div className="mx-auto h-10 w-10 md:h-12 md:w-12 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-3 md:mt-4 text-sm md:text-base text-gray-700">
            Dashboard wird geladen...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 to-blue-50">
        <div className="text-center">
          <p className="text-sm md:text-base text-gray-700">
            Admin-Daten konnten nicht geladen werden
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 pb-8 md:pb-12 ">
      <div className="w-full max-w-[95vw] xl:max-w-[1300px] 2xl:max-w-[1850px] mx-auto px-3 sm:px-4 py-6 md:py-8 lg:px-8">
        <div className="mb-6 md:mb-8 rounded-xl md:rounded-2xl bg-white p-4 md:p-6 shadow-sm backdrop-blur-sm">
          <div className="flex flex-col justify-between md:flex-row md:items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold text-gray-900 sm:text-2xl ">
                Willkommen zurück,{" "}
                <span className="text-red-900">{user.name.split(" ")[0]}</span>!
              </h1>
              <p className="mt-1 text-xs md:text-sm text-gray-600">
                Sie haben vollen administrativen Zugriff auf das System
              </p>
              <div className="mt-2 h-0.5 md:h-1 w-12 md:w-16 rounded-full bg-gradient-to-br from-red-600 to-black/80"></div>
            </div>

            <div className="mt-3 md:mt-4 flex items-center space-x-3 md:space-x-4 ">
              <div className="hidden text-right md:block">
                <p className="text-sm md:text-base font-medium text-gray-700">
                  {user.role}
                </p>
                <p className="text-xs md:text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center focus:outline-none transition-transform hover:scale-105"
                >
                  <img
                    src={user.image || "/default-avatar.png"}
                    alt={user.name}
                    className="h-8 w-8 md:h-10 md:w-10 rounded-full object-cover ring-1 md:ring-2 ring-white shadow-md"
                  />
                  <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 md:h-3 md:w-3 rounded-full bg-green-500 ring-1 md:ring-2 ring-white"></div>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Hauptinhalt */}
        <div className="mb-6 md:mb-8">
          <div className="mb-4 md:mb-6 flex items-center justify-between">
            <h2 className="text-lg md:text-xl font-semibold text-gray-800">
              Systemmodule
            </h2>
            <div className="hidden md:block h-px flex-1 bg-gradient-to-r from-transparent via-gray-300 to-transparent mx-4"></div>
            <span className="text-xs md:text-sm text-gray-500">
              {new Date().toLocaleDateString("de-DE", {
                weekday: "long",
                month: "short",
                day: "numeric",
              })}
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <NavigationCard
              href="/addcar"
              icon={<FiPlus />}
              title="Fahrzeug hinzufügen"
              description="Ein neues Fahrzeug zum Bestand hinzufügen"
              accentColor="blue"
            />
            <NavigationCard
              href="/excel"
              icon={<FiBook />}
              title="Buchhaltung"
              description="Finanzdaten und Aufzeichnungen"
              accentColor="green"
            />
            <NavigationCard
              href="/forms"
              icon={<FiFileText />}
              title="Verträge"
              description="Kaufverträge und Dokumente"
              accentColor="purple"
            />
            <NavigationCard
              href="/Plate"
              icon={<FiCalendar />}
              title="Kennzeichen"
              description="Temporäre Kennzeichen verwalten"
              accentColor="indigo"
            />
            <NavigationCard
              href="/trello"
              icon={<FiCheckSquare />}
              title="Trello-Board"
              description="Projektübersicht und Status"
              accentColor="orange"
            />
            <NavigationCard
              href="/Aufgaben"
              icon={<FiCheckSquare />}
              title="Aufgaben"
              description="Aufgabenmanagement-System"
              accentColor="amber"
            />
            <NavigationCard
              href="/PersonalData"
              icon={<FiMapPin />}
              title="Kontakte"
              description="Telefonnummern und Adressen"
              accentColor="rose"
            />
            <NavigationCard
              href="/punsh"
              icon={<FiClock />} // better suited for punch clock
              title="Stempeluhr"
              description="Ein- und Ausstempeln für Admins"
              accentColor="teal"
            />
            <NavigationCard
              href="/schlussel"
              icon={<FiKey />}
              title="Schlüssel"
              description="Schlüsselverwaltung"
              accentColor="cyan"
            />
            <NavigationCard
              href="/Reg"
              icon={<FiUserPlus />}
              title="Admin hinzufügen"
              description="Neuen Administrator registrieren"
              accentColor="lime"
            />
          </div>
        </div>
      </div>

      {showProfileModal && (
        <ProfileEditModal
          user={user}
          onClose={() => setShowProfileModal(false)}
          onSave={handleSaveProfile}
        />
      )}
    </div>
  );
}

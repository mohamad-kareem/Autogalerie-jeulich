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
  FiUpload,
  FiCamera,
  FiMapPin,
} from "react-icons/fi";
import toast from "react-hot-toast";

const NavigationCard = ({
  href,
  icon,
  title,
  description,
  bgColor,
  iconBgColor = "bg-white/20",
}) => (
  <Link href={href} passHref>
    <div
      className={`${bgColor} p-2 rounded-xl shadow-sm hover:shadow-md transition-all cursor-pointer text-white h-full`}
    >
      <div className="flex items-start">
        <div className={`p-2 rounded-lg ${iconBgColor} shadow-sm mr-4`}>
          {icon}
        </div>
        <div>
          <h2 className="text-lg font-semibold">{title}</h2>
          <p className="mt-1 text-sm text-white/90">{description}</p>
        </div>
      </div>
    </div>
  </Link>
);

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
      const response = await fetch(`/api/admins/${user._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error("Failed to update profile");
      }

      const updatedUser = await response.json();
      onSave(updatedUser);
      onClose();
      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-md w-full p-6 animate-fade-in">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-xl font-semibold">Edit Profile</h3>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="flex flex-col items-center mb-6">
            <div className="relative group">
              <img
                src={previewImage || "/default-avatar.png"}
                alt="Profile"
                className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 transition-colors shadow-md"
              >
                <FiCamera size={18} />
              </button>
            </div>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleImageChange}
              accept="image/*"
              className="hidden"
            />
            <button
              type="button"
              onClick={triggerFileInput}
              className="mt-3 flex items-center text-sm text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              <FiUpload className="mr-1" /> Change Image
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-all"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 cursor-not-allowed"
              />
              <p className="mt-1 text-xs text-gray-500">
                Email address cannot be changed.
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition-colors"
            >
              Save Changes
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

        const response = await fetch(`/api/admins/${session.user.id}`);
        if (!response.ok) {
          throw new Error("Failed to fetch admin data");
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
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500 mx-auto"></div>
          <p className="mt-4 text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-700">Failed to load admin data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 to-gray-300 ">
      <main className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto px-4 sm:px-6 lg:px-8 py-14">
        {/* Modern Welcome Section */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden mb-8">
          <div className="p-6 md:p-8 bg-gradient-to-r from-yellow-600 to-red-800 text-white">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
              <div>
                <h1 className="text-2xl md:text-3xl font-bold mb-2">
                  Welcome back, {user.name.split(" ")[0]}!
                </h1>
                <p className="text-indigo-100">
                  You have full administrator access to the system.
                </p>
              </div>
              <div className="mt-4 md:mt-0 flex items-center space-x-4">
                <div className="text-right hidden md:block">
                  <p className="font-medium">{user.role}</p>
                </div>
                <div className="relative group">
                  <button className="flex items-center focus:outline-none">
                    <img
                      src={user.image || "/default-avatar.png"}
                      alt={user.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-indigo-200 hover:border-indigo-300 transition-all"
                    />
                  </button>
                  <div className="absolute right-0 mt-2 w-48 origin-top-right bg-white rounded-md shadow-lg ring-1 ring-black ring-opacity-5 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-10">
                    <div className="py-1">
                      <div className="px-4 py-2 border-b">
                        <p className="text-sm font-medium text-gray-900">
                          {user.name}
                        </p>
                        <p className="text-xs text-gray-500">{user.email}</p>
                      </div>
                      <button
                        onClick={() => setShowProfileModal(true)}
                        className="w-full flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                      >
                        <FiEdit className="mr-3" /> Edit Profile
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="p-6 md:p-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Quick Start
            </h2>
            {/* Navigation Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8 mt-15">
              <NavigationCard
                href="/addcar"
                icon={<FiPlus />}
                title="Neues Auto"
                description="Ein Fahrzeug zum Bestand hinzufügen"
                bgColor="bg-gradient-to-br from-red-600 to-black hover:from-red-600 hover:to-red-800"
                iconBgColor="bg-red-800"
              />
              <NavigationCard
                href="/excel"
                icon={<FiBook />}
                title="Kassenbuch"
                description="Buchhaltung und Finanzen"
                bgColor="bg-gradient-to-br from-green-600 via-green-700 to-black hover:from-green-600 hover:to-green-800"
                iconBgColor="bg-green-700"
              />
              <NavigationCard
                href="/forms"
                icon={<FiFileText />}
                title="Kaufverträge"
                description="Dokumente und Vereinbarungen"
                bgColor="bg-gradient-to-br from-purple-500 to-black hover:from-purple-600 hover:to-purple-800"
                iconBgColor="bg-purple-700"
              />
              <NavigationCard
                href="/trello"
                icon={<FiCheckSquare />}
                title="Trello-Board"
                description="Projektübersicht und Status"
                bgColor="bg-gradient-to-br from-gray-600 to-black hover:from-gray-800 hover:to-gray-700"
                iconBgColor="bg-blue-800"
              />
              <NavigationCard
                href="/Aufgaben"
                icon={<FiCheckSquare />}
                title="Aufgaben"
                description="Aufgabenverwaltung und To-dos"
                bgColor="bg-gradient-to-br from-indigo-500 to-blue-500 hover:from-indigo-600 hover:to-indigo-800"
                iconBgColor="bg-indigo-700"
              />
              <NavigationCard
                href="/PersonalData"
                icon={<FiMapPin />}
                title="Kontaktdaten"
                description="Telefonnummern, Adressen, Orte und Kontakte"
                bgColor="bg-gradient-to-br from-gray-700 to-black hover:from-black hover:to-red-800"
                iconBgColor="bg-yellow-700"
              />
              <NavigationCard
                href="/schlussel"
                icon={<FiKey />}
                title="Schlüssel"
                description="Schlüsselverwaltung"
                bgColor="bg-gradient-to-br from-orange-500 via-orange-600 to-orange-950 hover:from-orange-600 hover:to-orange-800"
                iconBgColor="bg-orange-700"
              />
              <NavigationCard
                href="/Reg"
                icon={<FiUserPlus />}
                title="Admin hinzufügen"
                description="Neuen Administrator registrieren"
                bgColor="bg-gradient-to-br from-yellow-500 to-black hover:from-yellow-600 hover:to-yellow-800"
                iconBgColor="bg-yellow-700"
              />
            </div>
          </div>
        </div>
      </main>

      {/* Profile Edit Modal */}
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

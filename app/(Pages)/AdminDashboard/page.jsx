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
  FiCalendar,
  FiChevronRight,
} from "react-icons/fi";
import toast from "react-hot-toast";

const NavigationCard = ({ href, icon, title, description, accentColor }) => {
  const colorVariants = {
    red: "from-red-500 to-red-600",
    green: "from-emerald-500 to-emerald-600",
    purple: "from-violet-500 to-violet-600",
    blue: "from-blue-500 to-blue-600",
    indigo: "from-indigo-500 to-indigo-600",
    orange: "from-amber-500 to-amber-600",
    yellow: "from-yellow-500 to-yellow-600",
    gray: "from-gray-500 to-gray-600",
  };

  return (
    <Link href={href} passHref>
      <div className="group relative h-full overflow-hidden rounded-xl bg-white p-5 shadow-sm transition-all duration-200 hover:shadow-md">
        <div className="absolute inset-0 bg-gradient-to-br opacity-10 transition-opacity group-hover:opacity-20 ${colorVariants[accentColor]}"></div>
        <div className="relative z-10 flex items-start">
          <div
            className={`mr-4 rounded-lg p-3 bg-${accentColor}-100 text-${accentColor}-600`}
          >
            {icon}
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
            <p className="mt-1 text-sm text-gray-600">{description}</p>
            <div className="mt-3 flex items-center text-sm font-medium text-gray-500 transition-colors group-hover:text-gray-700">
              <span>Access module</span>
              <FiChevronRight className="ml-1" />
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="w-full max-w-md animate-fade-in rounded-xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between border-b pb-4">
          <h3 className="text-xl font-semibold text-gray-900">Edit Profile</h3>
          <button
            onClick={onClose}
            className="rounded-full p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500"
          >
            <FiX size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6">
          <div className="mb-6 flex flex-col items-center">
            <div className="relative">
              <img
                src={previewImage || "/default-avatar.png"}
                alt="Profile"
                className="h-24 w-24 rounded-full object-cover shadow-sm"
              />
              <button
                type="button"
                onClick={triggerFileInput}
                className="absolute bottom-0 right-0 rounded-full bg-indigo-600 p-2 text-white shadow-md transition-colors hover:bg-indigo-700"
              >
                <FiCamera size={16} />
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

          <div className="space-y-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full rounded-lg border border-gray-300 px-4 py-2 transition-all focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                required
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={user.email}
                readOnly
                className="w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-50 px-4 py-2"
              />
              <p className="mt-1 text-xs text-gray-500">
                Contact support to change your email address
              </p>
            </div>
          </div>

          <div className="mt-8 flex justify-end space-x-3 border-t pt-4">
            <button
              type="button"
              onClick={onClose}
              className="rounded-lg border border-gray-300 px-4 py-2 text-gray-700 transition-colors hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="rounded-lg bg-indigo-600 px-4 py-2 text-white transition-colors hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
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
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 animate-spin rounded-full border-t-2 border-b-2 border-indigo-500"></div>
          <p className="mt-4 text-gray-700">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="text-center">
          <p className="text-gray-700">Failed to load admin data</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8 rounded-xl bg-white p-6 shadow-sm">
          <div className="flex flex-col justify-between md:flex-row md:items-center">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 sm:text-3xl">
                Welcome back, {user.name.split(" ")[0]}
              </h1>
              <p className="mt-1 text-gray-600">
                You have full administrative access to the system
              </p>
            </div>

            <div className="mt-4 flex items-center space-x-4 md:mt-0">
              <div className="hidden text-right md:block">
                <p className="font-medium text-gray-700">{user.role}</p>
                <p className="text-sm text-gray-500">{user.email}</p>
              </div>
              <div className="relative">
                <button
                  onClick={() => setShowProfileModal(true)}
                  className="flex items-center focus:outline-none"
                >
                  <img
                    src={user.image || "/default-avatar.png"}
                    alt={user.name}
                    className="h-10 w-10 rounded-full object-cover ring-2 ring-white"
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="mb-8">
          <h2 className="mb-4 text-xl font-semibold text-gray-800">
            Quick Access
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <NavigationCard
              href="/addcar"
              icon={<FiPlus size={20} />}
              title="Add Vehicle"
              description="Add a new vehicle to inventory"
              accentColor="red"
            />
            <NavigationCard
              href="/excel"
              icon={<FiBook size={20} />}
              title="Accounting"
              description="Financial records and bookkeeping"
              accentColor="green"
            />
            <NavigationCard
              href="/forms"
              icon={<FiFileText size={20} />}
              title="Contracts"
              description="Sales agreements and documents"
              accentColor="purple"
            />
            <NavigationCard
              href="/Plate"
              icon={<FiCalendar size={20} />}
              title="License Plates"
              description="Manage temporary license plates"
              accentColor="blue"
            />
            <NavigationCard
              href="/trello"
              icon={<FiCheckSquare size={20} />}
              title="Trello Board"
              description="Project overview and status"
              accentColor="indigo"
            />
            <NavigationCard
              href="/Aufgaben"
              icon={<FiCheckSquare size={20} />}
              title="Tasks"
              description="Task management system"
              accentColor="orange"
            />
            <NavigationCard
              href="/PersonalData"
              icon={<FiMapPin size={20} />}
              title="Contacts"
              description="Phone numbers and addresses"
              accentColor="yellow"
            />
            <NavigationCard
              href="/schlussel"
              icon={<FiKey size={20} />}
              title="Keys"
              description="Key management system"
              accentColor="gray"
            />
            <NavigationCard
              href="/Reg"
              icon={<FiUserPlus size={20} />}
              title="Add Admin"
              description="Register new administrator"
              accentColor="indigo"
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

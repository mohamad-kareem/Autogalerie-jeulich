"use client";
import { useState, useEffect } from "react";
import {
  FiUser,
  FiPhone,
  FiMail,
  FiMapPin,
  FiGlobe,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiSave,
  FiSun,
  FiMoon,
  FiSearch,
} from "react-icons/fi";
import { toast } from "react-hot-toast";

const typeMap = {
  contacts: "contact",
  company: "company",
  locations: "location",
  emergency: "emergency",
};

const initialFormData = {
  type: "contact",
  name: "",
  phone: "",
  email: "",
  position: "",
  address: "",
  website: "",
  notes: "",
};

export default function AdminDashboard() {
  const [darkMode, setDarkMode] = useState(false);
  const [activeTab, setActiveTab] = useState("contacts");
  const [searchTerm, setSearchTerm] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [data, setData] = useState([]);
  const [formData, setFormData] = useState(initialFormData);
  const [isEditing, setIsEditing] = useState(false);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(
        `/api/admin?type=${typeMap[activeTab]}&search=${searchTerm}`
      );
      const result = await res.json();
      setData(result);
    } catch (error) {
      toast.error("Failed to fetch data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab, searchTerm]);

  useEffect(() => {
    const savedMode = localStorage.getItem("darkMode") === "true";
    setDarkMode(savedMode);
    document.documentElement.classList.toggle("dark", savedMode);
  }, []);

  const toggleDarkMode = () => {
    const newMode = !darkMode;
    setDarkMode(newMode);
    localStorage.setItem("darkMode", newMode.toString());
    document.documentElement.classList.toggle("dark", newMode);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData({
      ...initialFormData,
      type: typeMap[activeTab] || "contact",
    });
    setIsEditing(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const submissionData = {
        ...formData,
        type: typeMap[activeTab] || "contact",
      };

      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isEditing ? "update" : "create",
          data: submissionData,
        }),
      });

      const result = await response.json();

      if (response.ok) {
        toast.success(
          isEditing ? "Updated successfully!" : "Added successfully!"
        );
        fetchData();
        resetForm();
      } else {
        throw new Error(result.error || "Failed to save");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleEdit = (item) => {
    setFormData({
      ...item,
      _id: item._id,
    });
    setIsEditing(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this?")) return;

    try {
      const response = await fetch("/api/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete",
          data: { _id: id },
        }),
      });

      if (response.ok) {
        toast.success("Deleted successfully!");
        fetchData();
      } else {
        throw new Error("Failed to delete");
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div
      className={` min-h-screen transition-colors duration-300 ${
        darkMode ? "dark bg-gray-900 text-gray-100" : "bg-gray-50 text-gray-900"
      }`}
    >
      <div className="container mx-auto px-4 py-8">
        <header className="flex  items-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Admin Dashboard
          </h1>
          <button
            onClick={toggleDarkMode}
            className="p-2 mt-1 rounded-full hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          >
            {darkMode ? <FiSun size={20} /> : <FiMoon size={20} />}
          </button>
        </header>

        <div className="flex border-b border-gray-200 dark:border-gray-700 mb-6">
          {Object.keys(typeMap).map((tab) => (
            <button
              key={tab}
              className={`px-4 py-2 font-medium capitalize ${
                activeTab === tab
                  ? "border-b-2 border-blue-500 text-blue-600 dark:text-blue-400"
                  : "text-gray-500 dark:text-gray-400"
              }`}
              onClick={() => {
                setActiveTab(tab);
                resetForm();
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="mb-6 flex items-center bg-white dark:bg-gray-800 rounded-lg shadow-sm p-2">
          <FiSearch className="text-gray-400 mx-2" />
          <input
            type="text"
            placeholder={`Search ${activeTab}...`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-transparent outline-none dark:text-white"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-1">
            <div
              className={`p-6 rounded-lg shadow-md ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2 className="text-xl font-semibold mb-4">
                {isEditing ? "Edit Entry" : `Add New ${activeTab}`}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Name*
                    </label>
                    <input
                      type="text"
                      name="name"
                      value={formData.name}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Phone*
                    </label>
                    <input
                      type="tel"
                      name="phone"
                      value={formData.phone}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      required
                    />
                  </div>

                  {activeTab !== "locations" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  )}

                  {activeTab === "contacts" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Position
                      </label>
                      <input
                        type="text"
                        name="position"
                        value={formData.position}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Address
                    </label>
                    <input
                      type="text"
                      name="address"
                      value={formData.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Notes
                    </label>
                    <textarea
                      name="notes"
                      value={formData.notes}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:border-gray-600"
                      rows="2"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-2 mt-4">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={resetForm}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                  >
                    <FiSave className="mr-2" />
                    {isEditing ? "Update" : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>

          <div className="lg:col-span-2">
            <div
              className={`p-6 rounded-lg shadow-md ${
                darkMode ? "bg-gray-800" : "bg-white"
              }`}
            >
              <h2 className="text-xl font-semibold mb-4 capitalize">
                {activeTab} ({data.length})
              </h2>

              {isLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                </div>
              ) : data.length === 0 ? (
                <p className="text-gray-500 dark:text-gray-400">
                  No data found
                </p>
              ) : (
                <div className="space-y-4">
                  {data.map((item) => (
                    <div
                      key={item._id}
                      className={`p-4 rounded-lg border ${
                        darkMode
                          ? "border-gray-700 bg-gray-700"
                          : "border-gray-200 bg-gray-50"
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-semibold text-lg flex items-center">
                            {item.type === "contact" ? (
                              <FiUser className="mr-2 text-blue-500" />
                            ) : item.type === "location" ? (
                              <FiMapPin className="mr-2 text-red-500" />
                            ) : (
                              <FiGlobe className="mr-2 text-green-500" />
                            )}
                            {item.name}
                          </h3>
                          <p className="text-gray-600 dark:text-gray-300">
                            {item.position || item.address}
                          </p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => handleEdit(item)}
                            className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-gray-600 rounded-full transition-colors"
                          >
                            <FiEdit2 />
                          </button>
                          <button
                            onClick={() => handleDelete(item._id)}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-gray-600 rounded-full transition-colors"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                      <div className="mt-3 space-y-1">
                        {item.phone && (
                          <p className="flex items-center">
                            <FiPhone className="mr-2 text-green-500" />
                            {item.phone}
                          </p>
                        )}
                        {item.email && (
                          <p className="flex items-center">
                            <FiMail className="mr-2 text-purple-500" />
                            {item.email}
                          </p>
                        )}
                        {item.notes && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                            <span className="font-medium">Notes:</span>{" "}
                            {item.notes}
                          </p>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

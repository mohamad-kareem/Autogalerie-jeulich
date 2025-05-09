"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import {
  FiUser,
  FiHome,
  FiPhone,
  FiMail,
  FiGlobe,
  FiEdit2,
  FiTrash2,
  FiPlus,
  FiSearch,
  FiShield,
} from "react-icons/fi";

export default function ContactsDashboard() {
  const { data: session, status } = useSession();
  const [contacts, setContacts] = useState([]);
  const [filteredContacts, setFilteredContacts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [currentContact, setCurrentContact] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState({
    type: "personal",
    name: "",
    phone: "",
    mobile: "",
    email: "",
    address: "",
    website: "",
    notes: "",
    emergencyContact: false,
  });

  useEffect(() => {
    if (status === "authenticated") fetchContacts();
  }, [status]);

  const fetchContacts = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("/api/PersonalData");
      if (!res.ok) throw new Error("Failed to fetch contacts");
      const data = await res.json();
      setContacts(data);
      setFilteredContacts(data);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    let results = contacts;
    if (searchTerm) {
      results = results.filter((c) =>
        [c.name, c.phone, c.email].some((f) =>
          f?.toLowerCase().includes(searchTerm.toLowerCase())
        )
      );
    }
    if (activeTab !== "all") {
      if (activeTab === "emergency")
        results = results.filter((c) => c.emergencyContact);
      else results = results.filter((c) => c.type === activeTab);
    }
    setFilteredContacts(results);
  }, [searchTerm, activeTab, contacts]);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = currentContact ? "PUT" : "POST";
      const res = await fetch("/api/PersonalData", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          currentContact ? { ...formData, id: currentContact._id } : formData
        ),
      });
      if (!res.ok) throw new Error("Failed to save contact");
      toast.success(
        `Contact ${currentContact ? "updated" : "added"} successfully`
      );
      fetchContacts();
      resetForm();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setFormData({
      type: "personal",
      name: "",
      phone: "",
      mobile: "",
      email: "",
      address: "",
      website: "",
      notes: "",
      emergencyContact: false,
    });
    setCurrentContact(null);
    setIsFormOpen(false);
  };

  const handleEdit = (contact) => {
    setCurrentContact(contact);
    setFormData({
      type: contact.type,
      name: contact.name,
      phone: contact.phone || "",
      mobile: contact.mobile || "",
      email: contact.email || "",
      address: contact.address || "",
      website: contact.website || "",
      notes: contact.notes || "",
      emergencyContact: contact.emergencyContact || false,
    });
    setIsFormOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this contact?")) return;
    try {
      const res = await fetch("/api/PersonalData", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (!res.ok) throw new Error("Failed to delete contact");
      toast.success("Contact deleted successfully");
      fetchContacts();
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Secure Contacts
            </h1>
            <p className="text-gray-600 mt-2">
              Manage your personal and company contact information securely
            </p>
          </div>
          <button
            onClick={() => setIsFormOpen(true)}
            className="mt-4 md:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            <FiPlus className="-ml-1 mr-2 h-4 w-4" />
            Add New Contact
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="-mb-px flex space-x-8">
            {[
              {
                id: "all",
                name: "All Contacts",
                icon: <FiUser className="mr-2" />,
              },
              {
                id: "personal",
                name: "Personal",
                icon: <FiUser className="mr-2" />,
              },
              {
                id: "company",
                name: "Companies",
                icon: <FiHome className="mr-2" />,
              },
              {
                id: "emergency",
                name: "Emergency",
                icon: <FiShield className="mr-2" />,
              },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center ${
                  activeTab === tab.id
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                {tab.icon}
                {tab.name}
              </button>
            ))}
          </nav>
        </div>

        {/* Search */}
        <div className="mb-6 relative rounded-md shadow-sm max-w-md">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md p-2 border"
            placeholder="Search contacts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {/* Contact Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6">
                <h2 className="text-lg font-medium text-gray-900 mb-4">
                  {currentContact ? "Edit Contact" : "Add New Contact"}
                </h2>
                <form onSubmit={handleSubmit}>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Contact Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleInputChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md border"
                      >
                        <option value="personal">Personal</option>
                        <option value="company">Company</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        {formData.type === "company"
                          ? "Company Name"
                          : "Full Name"}
                      </label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        required
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Phone
                        </label>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Mobile
                        </label>
                        <input
                          type="tel"
                          name="mobile"
                          value={formData.mobile}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                      </label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    {formData.type === "company" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Website
                        </label>
                        <input
                          type="url"
                          name="website"
                          value={formData.website}
                          onChange={handleInputChange}
                          className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        />
                      </div>
                    )}

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Address
                      </label>
                      <textarea
                        name="address"
                        rows={3}
                        value={formData.address}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Notes
                      </label>
                      <textarea
                        name="notes"
                        rows={2}
                        value={formData.notes}
                        onChange={handleInputChange}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                      />
                    </div>

                    <div className="flex items-center">
                      <input
                        type="checkbox"
                        name="emergencyContact"
                        checked={formData.emergencyContact}
                        onChange={handleInputChange}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                      <label className="ml-2 block text-sm text-gray-700">
                        Mark as emergency contact
                      </label>
                    </div>
                  </div>

                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={resetForm}
                      className="inline-flex justify-center py-2 px-4 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      {currentContact ? "Update" : "Save"} Contact
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Contacts List */}
        {filteredContacts.length === 0 ? (
          <div className="bg-white rounded-lg shadow-sm p-8 text-center">
            <FiUser className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              No contacts found
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm
                ? "Try a different search term"
                : "Get started by adding a new contact"}
            </p>
            <div className="mt-6">
              <button
                onClick={() => setIsFormOpen(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
              >
                <FiPlus className="-ml-1 mr-2 h-4 w-4" />
                Add Contact
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <ul className="divide-y divide-gray-200">
              {filteredContacts.map((contact) => (
                <li key={contact.id} className="hover:bg-gray-50">
                  <div className="px-4 py-4 sm:px-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {contact.emergencyContact && (
                          <span className="mr-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                            <FiShield className="mr-1" /> Emergency
                          </span>
                        )}
                        <p className="text-sm font-medium text-blue-600 truncate">
                          {contact.name}
                        </p>
                        <span className="ml-2 inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {contact.type === "personal" ? "Personal" : "Company"}
                        </span>
                      </div>
                      <div className="ml-2 flex-shrink-0 flex space-x-2">
                        <button
                          onClick={() => handleEdit(contact)}
                          className="text-gray-400 hover:text-blue-500"
                        >
                          <FiEdit2 className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(contact.id)}
                          className="text-gray-400 hover:text-red-500"
                        >
                          <FiTrash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </div>
                    <div className="mt-2 sm:flex sm:justify-between">
                      <div className="sm:flex">
                        {contact.phone && (
                          <p className="flex items-center text-sm text-gray-500 mr-4">
                            <FiPhone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {contact.phone}
                          </p>
                        )}
                        {contact.mobile && (
                          <p className="flex items-center text-sm text-gray-500 mr-4">
                            <FiPhone className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {contact.mobile}
                          </p>
                        )}
                        {contact.email && (
                          <p className="flex items-center text-sm text-gray-500">
                            <FiMail className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                            {contact.email}
                          </p>
                        )}
                      </div>
                      {contact.type === "company" && contact.website && (
                        <div className="mt-2 flex items-center text-sm text-gray-500 sm:mt-0">
                          <FiGlobe className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                          <a
                            href={
                              contact.website.startsWith("http")
                                ? contact.website
                                : `https://${contact.website}`
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-500 hover:underline"
                          >
                            {contact.website.replace(/^https?:\/\//, "")}
                          </a>
                        </div>
                      )}
                    </div>
                    {contact.address && (
                      <div className="mt-2 flex items-center text-sm text-gray-500">
                        <FiHome className="flex-shrink-0 mr-1.5 h-4 w-4 text-gray-400" />
                        <p>{contact.address}</p>
                      </div>
                    )}
                    {contact.notes && (
                      <div className="mt-2 text-sm text-gray-500">
                        <p>{contact.notes}</p>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

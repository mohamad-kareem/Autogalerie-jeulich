"use client";
import { useState, useEffect } from "react";
import {
  FiRefreshCw,
  FiPlus,
  FiMoon,
  FiSun,
  FiDownload,
  FiPrinter,
} from "react-icons/fi";
import { useSession } from "next-auth/react";
import { toast } from "react-hot-toast";
import SummaryCards from "@/app/(components)/admin/excel/SummaryCards";
import AnalyticsSection from "@/app/(components)/admin/excel/AnalyticsSection";
import EntriesTable from "@/app/(components)/admin/excel/table/EntriesTable";
import Filters from "@/app/(components)/admin/excel/Filters";
import EntryForm from "@/app/(components)/admin/excel/EntryForm";
import Tabs from "@/app/(components)/admin/excel/Tabs";
import { exportToExcel } from "@/app/utils/ExportService";
import { printEntries } from "@/app/utils/PrintService";

const CashBookPage = () => {
  const { data: session, status } = useSession();
  const [darkMode, setDarkMode] = useState(false);
  const [state, setState] = useState({
    entries: [],
    formData: {
      date: new Date().toISOString().split("T")[0],
      income: "",
      expense: "",
      account: "",
      documentType: "",
      documentNumber: "",
      description: "",
      category: "",
      tax: "19%",
      carName: "",
    },
    editId: null,
    filterMonth: new Date().getMonth() + 1,
    filterYear: new Date().getFullYear(),
    searchTerm: "",
    activeTab: "einträge",
    expandedEntry: null,
    isFormExpanded: false,
    isLoading: true,
  });

  useEffect(() => {
    if (status === "authenticated") {
      fetchEntries();
    }
  }, [status]);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    document.documentElement.classList.toggle("dark");
  };

  const fetchEntries = async () => {
    try {
      setState((prev) => ({ ...prev, isLoading: true }));
      const response = await fetch("/api/entries", {
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to fetch entries");
      }

      const data = await response.json();
      setState((prev) => ({ ...prev, entries: data, isLoading: false }));
    } catch (error) {
      toast.error(error.message);
      setState((prev) => ({ ...prev, isLoading: false }));
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setState((prev) => ({
      ...prev,
      formData: { ...prev.formData, [name]: value },
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!session?.user?.id) {
      toast.error("Authentication required");
      return;
    }

    try {
      const { formData, editId } = state;
      const entryData = {
        ...formData,
        date: new Date(formData.date),
        income: parseFloat(formData.income) || 0,
        expense: parseFloat(formData.expense) || 0,
        createdBy: session.user.id,
      };

      const method = editId ? "PUT" : "POST";
      const url = editId ? `/api/entries/${editId}` : "/api/entries";

      const response = await fetch(url, {
        method,
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entryData),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success(`Entry ${editId ? "updated" : "created"} successfully`);
      fetchEntries();
      resetForm();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const resetForm = () => {
    setState((prev) => ({
      ...prev,
      formData: {
        date: new Date().toISOString().split("T")[0],
        income: "",
        expense: "",
        account: "",
        documentType: "",
        documentNumber: "",
        description: "",
        category: "",
        tax: "19%",
        carName: "",
      },
      editId: null,
      isFormExpanded: false,
    }));
  };

  const handleEdit = (id) => {
    const entry = state.entries.find((e) => e._id === id);
    if (entry) {
      setState((prev) => ({
        ...prev,
        formData: {
          ...entry,
          date: new Date(entry.date).toISOString().split("T")[0],
        },
        editId: id,
        isFormExpanded: true,
      }));
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this entry?")) return;

    try {
      const response = await fetch(`/api/entries/${id}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message);
      }

      toast.success("Entry deleted successfully");
      fetchEntries();
    } catch (error) {
      toast.error(error.message);
    }
  };

  const toggleExpandEntry = (id) => {
    setState((prev) => ({
      ...prev,
      expandedEntry: prev.expandedEntry === id ? null : id,
    }));
  };

  const handleExport = () => {
    const { filterMonth, filterYear, entriesWithBalance } = calculateData();
    exportToExcel(entriesWithBalance, `cashbook_${filterMonth}_${filterYear}`);
  };

  const handlePrint = () => {
    const { filterMonth, filterYear, entriesWithBalance, totals } =
      calculateData();
    printEntries(entriesWithBalance, filterMonth, filterYear, totals);
  };

  const calculateData = () => {
    const { entries, filterMonth, filterYear, searchTerm } = state;

    const filteredEntries = entries
      .filter((entry) => {
        const entryDate = new Date(entry.date);
        return (
          entryDate.getMonth() + 1 === parseInt(filterMonth) &&
          entryDate.getFullYear() === parseInt(filterYear) &&
          (entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.documentNumber
              ?.toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            entry.carName?.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      })
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const entriesWithBalance = filteredEntries.reduce((acc, entry, index) => {
      const prevBalance = index > 0 ? acc[index - 1].balance : 0;
      const balance = prevBalance + (entry.income || 0) - (entry.expense || 0);
      return [...acc, { ...entry, balance }];
    }, []);

    const totalIncome = entriesWithBalance.reduce(
      (sum, entry) => sum + (entry.income || 0),
      0
    );
    const totalExpense = entriesWithBalance.reduce(
      (sum, entry) => sum + (entry.expense || 0),
      0
    );
    const currentBalance =
      entriesWithBalance.length > 0
        ? entriesWithBalance[entriesWithBalance.length - 1].balance
        : 0;

    const dailyData = entriesWithBalance.reduce((acc, entry) => {
      const dateStr = new Date(entry.date).toLocaleDateString("de-DE", {
        day: "numeric",
        month: "short",
      });

      const existingDay = acc.find((item) => item.date === dateStr);
      if (existingDay) {
        existingDay.income += entry.income || 0;
        existingDay.expense += entry.expense || 0;
        existingDay.balance = entry.balance;
      } else {
        acc.push({
          date: dateStr,
          income: entry.income || 0,
          expense: entry.expense || 0,
          balance: entry.balance,
        });
      }
      return acc;
    }, []);

    const categoryData = entriesWithBalance.reduce((acc, entry) => {
      const category = entry.category || "Other";
      const existingCat = acc.find((item) => item.name === category);
      const amount = (entry.income || 0) - (entry.expense || 0);

      if (existingCat) {
        existingCat.value += amount;
      } else {
        acc.push({ name: category, value: amount });
      }
      return acc;
    }, []);

    return {
      filterMonth,
      filterYear,
      entriesWithBalance,
      dailyData,
      categoryData,
      totals: { totalIncome, totalExpense, currentBalance },
    };
  };

  if (state.isLoading || status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-lime-400"></div>
      </div>
    );
  }

  const {
    entriesWithBalance,
    dailyData,
    categoryData,
    totals: { totalIncome, totalExpense, currentBalance },
  } = calculateData();

  return (
    <div
      className={`min-h-screen transition-colors duration-300 ${
        darkMode ? "bg-gradient-to-br from-gray-900 to-gray-800" : "bg-gray-50"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <header className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
            <div>
              <h1
                className={`text-3xl font-bold ${
                  darkMode ? "text-lime-400" : "text-gray-900"
                }`}
              >
                Cash Book
              </h1>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className={darkMode ? "text-gray-300" : "text-gray-600"}>
                  {new Date(
                    state.filterYear,
                    state.filterMonth - 1,
                    1
                  ).toLocaleDateString("en-US", {
                    month: "long",
                    year: "numeric",
                  })}
                </span>
                <button
                  onClick={fetchEntries}
                  className={`p-1.5 rounded-full ${
                    darkMode ? "hover:bg-gray-800" : "hover:bg-gray-100"
                  }`}
                >
                  <FiRefreshCw
                    className={darkMode ? "text-lime-400" : "text-gray-600"}
                  />
                </button>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                onClick={toggleDarkMode}
                className={`p-2 rounded-full ${
                  darkMode
                    ? "bg-gray-800 text-lime-400"
                    : "bg-gray-200 text-gray-700"
                }`}
              >
                {darkMode ? (
                  <FiSun className="h-5 w-5" />
                ) : (
                  <FiMoon className="h-5 w-5" />
                )}
              </button>
            </div>
          </div>
        </header>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8">
          <div
            className={`p-5 rounded-xl ${
              darkMode
                ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                : "bg-white shadow-sm border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-500"
                }`}
              >
                Total Income
              </h3>
              <span
                className={`text-xl font-bold ${
                  darkMode ? "text-lime-400" : "text-gray-900"
                }`}
              >
                {totalIncome.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
          </div>
          <div
            className={`p-5 rounded-xl ${
              darkMode
                ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                : "bg-white shadow-sm border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-500"
                }`}
              >
                Total Expense
              </h3>
              <span
                className={`text-xl font-bold ${
                  darkMode ? "text-rose-400" : "text-gray-900"
                }`}
              >
                {totalExpense.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
          </div>
          <div
            className={`p-5 rounded-xl ${
              darkMode
                ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
                : "bg-white shadow-sm border border-gray-200"
            }`}
          >
            <div className="flex items-center justify-between">
              <h3
                className={`text-sm font-medium ${
                  darkMode ? "text-gray-300" : "text-gray-500"
                }`}
              >
                Current Balance
              </h3>
              <span
                className={`text-xl font-bold ${
                  currentBalance >= 0
                    ? darkMode
                      ? "text-lime-400"
                      : "text-gray-900"
                    : darkMode
                    ? "text-rose-400"
                    : "text-rose-600"
                }`}
              >
                {currentBalance.toLocaleString("de-DE", {
                  style: "currency",
                  currency: "EUR",
                })}
              </span>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div
          className={`rounded-xl ${
            darkMode
              ? "bg-gray-800/50 backdrop-blur-sm border border-gray-700"
              : "bg-white shadow-sm border border-gray-200"
          }`}
        >
          {/* Tabs */}
          <div className="border-b border-gray-700">
            <nav className="flex -mb-px">
              <button
                onClick={() =>
                  setState((prev) => ({ ...prev, activeTab: "einträge" }))
                }
                className={`py-4 px-6 text-sm font-medium ${
                  state.activeTab === "einträge"
                    ? darkMode
                      ? "text-lime-400 border-lime-400"
                      : "text-gray-900 border-gray-900"
                    : darkMode
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
                } border-b-2 ${
                  state.activeTab === "einträge"
                    ? "border-b-2"
                    : "border-transparent"
                }`}
              >
                Entries
              </button>
              <button
                onClick={() =>
                  setState((prev) => ({ ...prev, activeTab: "analytics" }))
                }
                className={`py-4 px-6 text-sm font-medium ${
                  state.activeTab === "analytics"
                    ? darkMode
                      ? "text-lime-400 border-lime-400"
                      : "text-gray-900 border-gray-900"
                    : darkMode
                    ? "text-gray-400 hover:text-gray-300"
                    : "text-gray-500 hover:text-gray-700"
                } border-b-2 ${
                  state.activeTab === "analytics"
                    ? "border-b-2"
                    : "border-transparent"
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>

          <div className="p-6">
            {state.activeTab === "einträge" && (
              <>
                {/* Filters and Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
                  <Filters
                    filterMonth={state.filterMonth}
                    setFilterMonth={(month) =>
                      setState((prev) => ({ ...prev, filterMonth: month }))
                    }
                    filterYear={state.filterYear}
                    setFilterYear={(year) =>
                      setState((prev) => ({ ...prev, filterYear: year }))
                    }
                    searchTerm={state.searchTerm}
                    setSearchTerm={(term) =>
                      setState((prev) => ({ ...prev, searchTerm: term }))
                    }
                    darkMode={darkMode}
                  />

                  <div className="flex items-center gap-3">
                    <button
                      onClick={handleExport}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                        darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      <FiDownload className="h-4 w-4" />
                      Export
                    </button>
                    <button
                      onClick={handlePrint}
                      className={`flex items-center gap-2 px-3 py-2 rounded-md text-sm ${
                        darkMode
                          ? "bg-gray-700 hover:bg-gray-600 text-gray-200"
                          : "bg-gray-100 hover:bg-gray-200 text-gray-700"
                      }`}
                    >
                      <FiPrinter className="h-4 w-4" />
                      Print
                    </button>
                    <button
                      onClick={() =>
                        setState((prev) => ({
                          ...prev,
                          isFormExpanded: !prev.isFormExpanded,
                        }))
                      }
                      className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm ${
                        darkMode
                          ? "bg-lime-600 hover:bg-lime-500 text-white"
                          : "bg-lime-600 hover:bg-lime-700 text-white"
                      }`}
                    >
                      <FiPlus className="h-4 w-4" />
                      New Entry
                    </button>
                  </div>
                </div>

                {state.isFormExpanded && (
                  <EntryForm
                    formData={state.formData}
                    handleInputChange={handleInputChange}
                    handleSubmit={handleSubmit}
                    editId={state.editId}
                    setIsFormExpanded={(expanded) =>
                      setState((prev) => ({
                        ...prev,
                        isFormExpanded: expanded,
                      }))
                    }
                    resetForm={resetForm}
                    darkMode={darkMode}
                  />
                )}

                <EntriesTable
                  entries={entriesWithBalance}
                  expandedEntry={state.expandedEntry}
                  toggleExpandEntry={toggleExpandEntry}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  isFormExpanded={state.isFormExpanded}
                  darkMode={darkMode}
                />
              </>
            )}

            {state.activeTab === "analytics" && (
              <AnalyticsSection
                dailyData={dailyData}
                categoryData={categoryData}
                darkMode={darkMode}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashBookPage;

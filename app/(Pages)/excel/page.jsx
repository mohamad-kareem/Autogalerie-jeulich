"use client";
import { useState, useEffect } from "react";
import { FiRefreshCw, FiPlus } from "react-icons/fi";
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

      toast.success(`Entry ${editId ? "updated" : "created"} successfully`, {
        style: {
          background: "#16a34a",
          color: "#fff",
        },
      });
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
    if (!confirm("Möchten Sie diesen Eintrag wirklich löschen?")) return;

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

      toast.success("Entry deleted successfully", {
        style: {
          background: "#16a34a",
          color: "#fff",
        },
      });
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
    exportToExcel(
      entriesWithBalance,
      `kassenbuch_${filterMonth}_${filterYear}`
    );
  };

  const handlePrint = () => {
    const { filterMonth, filterYear, entriesWithBalance, totals } =
      calculateData();
    printEntries(entriesWithBalance, filterMonth, filterYear, totals);
  };

  const calculateData = () => {
    const { entries, filterMonth, filterYear, searchTerm } = state;

    const filteredEntries = entries.filter((entry) => {
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
    });

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
      const category = entry.category || "Sonstiges";
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
      <div className="min-h-screen bg-green-50 p-4 md:p-8 mt-10">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
          </div>
        </div>
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
    <div className="min-h-screen bg-gradient-to-br from-green-300 to-green-900 p-4 md:pl-8">
      <div className="w-full max-w-[95vw] xl:max-w-[1280px] 2xl:max-w-[1536px] mx-auto">
        {/* Header */}
        <div className="flex flex-col md:flex-row  items-start md:items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-green-800">Kassenbuch</h1>
            <p className="text-green-600 mt-1">
              {new Date(
                state.filterYear,
                state.filterMonth - 1,
                1
              ).toLocaleDateString("de-DE", { month: "long", year: "numeric" })}
            </p>
          </div>
        </div>

        <SummaryCards
          totalIncome={totalIncome}
          totalExpense={totalExpense}
          currentBalance={currentBalance}
        />

        {/* Main Content */}
        <div className="bg-white rounded-xl shadow-md overflow-hidden mb-8">
          <Tabs
            activeTab={state.activeTab}
            setActiveTab={(tab) =>
              setState((prev) => ({ ...prev, activeTab: tab }))
            }
          />

          <div className="p-6">
            {state.activeTab === "einträge" && (
              <>
                {/* Filters and Actions */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
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
                  />
                  <button
                    onClick={() =>
                      setState((prev) => ({
                        ...prev,
                        isFormExpanded: !prev.isFormExpanded,
                      }))
                    }
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <FiPlus className="-ml-1 mr-2 h-4 w-4" />
                    Neuer Eintrag
                  </button>
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
                  />
                )}

                <EntriesTable
                  entries={entriesWithBalance}
                  expandedEntry={state.expandedEntry}
                  toggleExpandEntry={toggleExpandEntry}
                  handleEdit={handleEdit}
                  handleDelete={handleDelete}
                  handlePrint={handlePrint}
                  handleExport={handleExport}
                  isFormExpanded={state.isFormExpanded}
                />
              </>
            )}

            {state.activeTab === "analytics" && (
              <AnalyticsSection
                dailyData={dailyData}
                categoryData={categoryData}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CashBookPage;

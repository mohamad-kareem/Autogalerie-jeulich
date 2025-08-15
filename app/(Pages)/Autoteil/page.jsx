"use client";

import { useEffect, useMemo, useState } from "react";
import {
  FiSearch,
  FiPlus,
  FiTrash2,
  FiSave,
  FiPrinter,
  FiFilter,
  FiArrowLeft,
  FiDollarSign,
  FiUser,
  FiX,
  FiCornerUpLeft,
  FiEdit3,
  FiChevronLeft,
  FiChevronRight,
} from "react-icons/fi";
import { useSession } from "next-auth/react";
import { toast } from "react-toastify";

const OWNERS = ["Karim", "Alawie"];

const currencyFmt = (v, currency = "EUR") => {
  try {
    return new Intl.NumberFormat(undefined, {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(Number(v ?? 0));
  } catch {
    return `${currency} ${Number(v ?? 0).toFixed(2)}`;
  }
};

// compact pagination items with ellipses
const getPageItems = (page, pages) => {
  if (pages <= 7) return Array.from({ length: pages }, (_, i) => i + 1);
  const items = [1];
  if (page > 3) items.push("…");
  const start = Math.max(2, page - 1);
  const end = Math.min(pages - 1, page + 1);
  for (let p = start; p <= end; p++) items.push(p);
  if (page < pages - 2) items.push("…");
  items.push(pages);
  return items;
};

export default function ReclamationDashboard() {
  const { data: session } = useSession();

  const [parts, setParts] = useState([]);
  const [loading, setLoading] = useState(true);

  // filters & paging
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [ownerFilter, setOwnerFilter] = useState("all");
  const [pagination, setPagination] = useState({
    page: 1,
    limit: 20,
    total: 0,
    pages: 1,
  });

  // add / edit
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);

  const blankPart = {
    partName: "",
    vehicleId: "",
    finNumber: "",
    quantity: 1,
    price: 0,
    currency: "EUR",
    status: "pending",
    returnToSupplier: false,
    supplier: "",
    notes: "",
    owner: "Karim",
  };
  const [form, setForm] = useState(blankPart);

  const fetchParts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        search: searchTerm,
        status: statusFilter === "all" ? "" : statusFilter,
        owner: ownerFilter === "all" ? "" : ownerFilter,
        page: String(pagination.page),
        limit: String(pagination.limit),
      });
      const res = await fetch(`/api/parts/reclamation?${params}`);
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to fetch parts");
        return;
      }
      setParts(data.data || []);
      setPagination((p) => ({ ...p, total: data.total, pages: data.pages }));
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchParts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, searchTerm, statusFilter, ownerFilter, pagination.page]);

  const openAdd = () => {
    setEditing(null);
    setForm({ ...blankPart });
    setShowForm(true);
  };

  const openEdit = (part) => {
    setEditing(part);
    setForm({
      partName: part.partName || "",
      vehicleId: part.vehicleId || "",
      finNumber: part.finNumber || "",
      quantity: part.quantity ?? 1,
      price: part.price ?? 0,
      currency: part.currency || "EUR",
      status: part.status || "pending",
      returnToSupplier: !!part.returnToSupplier,
      supplier: part.supplier || "",
      notes: part.notes || "",
      owner: part.owner || "Karim",
    });
    setShowForm(true);
  };

  const closeForm = () => {
    setShowForm(false);
    setEditing(null);
    setForm(blankPart);
  };

  const onFormChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((f) => ({ ...f, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const url = editing
        ? `/api/parts/reclamation/${editing._id}`
        : "/api/parts/reclamation";
      const method = editing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!data.success) {
        toast.error(data.error || "Failed to save");
        return;
      }
      toast.success(editing ? "Part updated" : "Part added");
      closeForm();
      setPagination((p) => ({ ...p, page: 1 }));
      fetchParts();
    } catch (err) {
      toast.error(err.message);
    }
  };

  const updateStatus = async (id, newStatus) => {
    try {
      const res = await fetch(`/api/parts/reclamation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });
      const data = await res.json();
      if (!data.success) return toast.error(data.error || "Failed to update");
      toast.success("Status updated");
      fetchParts();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const markReturned = async (id) => {
    const returnReason = prompt("Enter return reason:");
    if (!returnReason) return;
    try {
      const res = await fetch(`/api/parts/reclamation/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "returned",
          returnToSupplier: true,
          returnReason,
          returnDate: new Date().toISOString(),
        }),
      });
      const data = await res.json();
      if (!data.success) return toast.error(data.error || "Failed to update");
      toast.success("Marked as returned");
      fetchParts();
    } catch (e) {
      toast.error(e.message);
    }
  };

  const deletePart = async (id) => {
    if (!confirm("Delete this part?")) return;
    try {
      const res = await fetch(`/api/parts/reclamation/${id}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!data.success) return toast.error(data.error || "Failed to delete");
      toast.success("Deleted");
      fetchParts();
    } catch (e) {
      toast.error(e.message);
    }
  };
  const buildPrintTable = (items) => {
    const rows = items
      .map(
        (p, idx) => `
      <tr>
        <td>${idx + 1}</td>
        <td>${p.partName ?? "-"}</td>
        <td>${p.vehicleId ?? "-"}</td>
        <td>${p.finNumber ?? "-"}</td>
        <td style="text-align:right;">${p.quantity ?? 0}</td>
        <td style="text-align:right;">${currencyFmt(
          Number(p.price || 0) * Number(p.quantity || 1),
          p.currency || "EUR"
        )}</td>
        <td style="text-align:right;">${p.status ?? "-"}</td>
        <td style="text-align:right;">${p.owner ?? "-"}</td>
        <td style="text-align:right;">${
          p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "--"
        }</td>
      </tr>`
      )
      .join("");

    return `
    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Part</th>
          <th>Vehicle</th>
          <th>FIN</th>
          <th style="text-align:right;">Qty</th>
          <th style="text-align:right;">Total</th>
          <th style="text-align:right;">Status</th>
          <th style="text-align:right;">Owner</th>
          <th style="text-align:right;">Date</th>
        </tr>
      </thead>
      <tbody>${rows}</tbody>
    </table>
  `;
  };

  const printParts = (items, title = "Parts Reclamation — List") => {
    const w = window.open("", "_blank");
    if (!w)
      return toast.error("Pop-up blocked. Please allow pop-ups to print.");

    const now = new Date();
    const info = `
    <div class="meta">
      <div><strong>Printed:</strong> ${now.toLocaleString()}</div>
      <div><strong>Total rows:</strong> ${items.length}</div>
    </div>
  `;

    const html = `
    <!doctype html>
    <html>
    <head>
      <meta charset="utf-8"/>
      <title>${title}</title>
      <style>
        * { box-sizing: border-box; }
        body { font-family: Arial, sans-serif; margin: 20px; color: #111; }
        h1 { margin: 0 0 10px; font-size: 20px; }
        .meta { display: flex; gap: 20px; font-size: 12px; color: #555; margin-bottom: 12px; }
        table { width: 100%; border-collapse: collapse; }
        thead { background: #f3f4f6; }
        th, td { border: 1px solid #e5e7eb; padding: 8px; font-size: 12px; }
        th { text-align: left; }
        @media print {
          @page { margin: 12mm; }
          thead { display: table-header-group; }
          tfoot { display: table-row-group; }
          button { display: none !important; }
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${info}
      ${buildPrintTable(items)}
      <script>
        window.addEventListener('load', () => {
          setTimeout(() => {
            window.print();
          }, 200);
        });
      </script>
    </body>
    </html>
  `;
    w.document.open();
    w.document.write(html);
    w.document.close();
  };

  const printSingle = (part) => {
    printParts([part], `Parts Reclamation — ${part.partName || "Item"}`);
  };

  const stats = useMemo(() => {
    const totalValue = parts.reduce(
      (sum, p) =>
        sum +
        (Number(p.totalCost) || Number(p.price || 0) * Number(p.quantity || 1)),
      0
    );
    const pending = parts.filter((p) => p.status === "pending").length;
    return { totalValue, pending };
  }, [parts]);

  const pageItems = useMemo(
    () => getPageItems(pagination.page, pagination.pages),
    [pagination.page, pagination.pages]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-2 sm:p-4">
      <div className="mx-auto w-full max-w-7xl">
        {/* Header */}
        <header className="mb-3 sm:mb-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h1 className="text-lg sm:text-xl font-bold text-gray-900">
              Parts Reclamation
            </h1>
          </div>
        </header>

        {/* Compact Stats */}
        <div className="mb-3 grid grid-cols-3 gap-2 sm:gap-3">
          <div className="rounded-md border border-gray-200 bg-white p-2 shadow-xs">
            <h3 className="text-[10px] font-medium text-gray-500">
              Total Parts
            </h3>
            <p className="text-sm font-bold text-gray-900">
              {pagination.total}
            </p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-2 shadow-xs">
            <h3 className="text-[10px] font-medium text-gray-500">Pending</h3>
            <p className="text-sm font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="rounded-md border border-gray-200 bg-white p-2 shadow-xs">
            <h3 className="text-[10px] font-medium text-gray-500">
              Total Value
            </h3>
            <p className="text-sm font-bold text-blue-700">
              {currencyFmt(stats.totalValue, "EUR")}
            </p>
          </div>
        </div>

        {/* Compact Search & Filters */}
        <div className="mb-3 rounded-lg border border-gray-200 bg-white p-2 shadow-sm">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <FiSearch className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
              <input
                type="text"
                placeholder="Search parts..."
                className="w-full rounded-md border border-gray-300 pl-8 pr-2 py-1.5 h-8 text-xs sm:text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setPagination((p) => ({ ...p, page: 1 }));
                }}
              />
            </div>

            <div className="flex items-center gap-1 sm:gap-2">
              <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-xs">
                <FiFilter className="text-gray-500 text-xs" />
                <select
                  className="bg-transparent text-xs focus:outline-none"
                  value={statusFilter}
                  onChange={(e) => {
                    setStatusFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  <option value="all">All Status</option>
                  <option value="pending">Pending</option>
                  <option value="ordered">Ordered</option>
                  <option value="received">Received</option>
                  <option value="installed">Installed</option>
                  <option value="returned">Returned</option>
                </select>
              </div>

              <div className="flex items-center gap-1 rounded-md border border-gray-300 bg-gray-50 px-2 py-1 text-xs">
                <FiUser className="text-gray-500 text-xs" />
                <select
                  className="bg-transparent text-xs focus:outline-none"
                  value={ownerFilter}
                  onChange={(e) => {
                    setOwnerFilter(e.target.value);
                    setPagination((p) => ({ ...p, page: 1 }));
                  }}
                >
                  <option value="all">All Owners</option>
                  {OWNERS.map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => printParts(parts)}
                disabled={loading || parts.length === 0}
                className="inline-flex items-center gap-1 rounded-md bg-gray-700 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-sm transition hover:bg-gray-800 disabled:opacity-60"
                title="Print current list"
              >
                <FiPrinter className="text-sm" /> Print
              </button>

              <button
                onClick={openAdd}
                disabled={loading}
                className="inline-flex items-center gap-1 rounded-md bg-blue-600 px-2.5 py-1.5 text-xs sm:text-sm font-medium text-white shadow-sm transition hover:bg-blue-700 disabled:opacity-60"
              >
                <FiPlus className="text-sm" /> Add Part
              </button>
            </div>
          </div>

          {/* Add/Edit Form */}
          {showForm && (
            <form
              onSubmit={handleSubmit}
              className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-sm font-semibold">
                  {editing ? "Edit Part" : "New Part"}
                </h3>
                <button
                  type="button"
                  className="inline-flex items-center gap-1 text-gray-600 hover:text-gray-900 text-xs"
                  onClick={closeForm}
                >
                  <FiX /> Close
                </button>
              </div>

              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-700">
                    Part Name *
                  </label>
                  <input
                    type="text"
                    name="partName"
                    value={form.partName}
                    onChange={onFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-700">
                    Vehicle Name/VIN *
                  </label>
                  <input
                    type="text"
                    name="vehicleId"
                    value={form.vehicleId}
                    onChange={onFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-700">
                    FIN Number
                  </label>
                  <input
                    type="text"
                    name="finNumber"
                    value={form.finNumber}
                    onChange={onFormChange}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-700">
                    Quantity
                  </label>
                  <input
                    type="number"
                    min={1}
                    name="quantity"
                    value={form.quantity}
                    onChange={onFormChange}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-700">
                    Price
                  </label>
                  <div className="relative">
                    <FiDollarSign className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-gray-400 text-xs" />
                    <input
                      type="number"
                      name="price"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={onFormChange}
                      className="w-full rounded-md border border-gray-300 pl-7 pr-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                    />
                  </div>
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-700">
                    Currency
                  </label>
                  <select
                    name="currency"
                    value={form.currency}
                    onChange={onFormChange}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  >
                    <option value="EUR">EUR</option>
                    <option value="USD">USD</option>
                    <option value="GBP">GBP</option>
                  </select>
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-700">
                    Status
                  </label>
                  <select
                    name="status"
                    value={form.status}
                    onChange={onFormChange}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  >
                    <option value="pending">Pending</option>
                    <option value="ordered">Ordered</option>
                    <option value="received">Received</option>
                    <option value="installed">Installed</option>
                    <option value="returned">Returned</option>
                  </select>
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-700">
                    Supplier
                  </label>
                  <input
                    type="text"
                    name="supplier"
                    value={form.supplier}
                    onChange={onFormChange}
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  />
                </div>

                <div>
                  <label className="mb-0.5 block text-xs font-medium text-gray-700">
                    Owner *
                  </label>
                  <select
                    name="owner"
                    value={form.owner}
                    onChange={onFormChange}
                    required
                    className="w-full rounded-md border border-gray-300 px-2 py-1.5 h-8 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                  >
                    {OWNERS.map((o) => (
                      <option key={o} value={o}>
                        {o}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-5">
                  <input
                    type="checkbox"
                    name="returnToSupplier"
                    checked={form.returnToSupplier}
                    onChange={onFormChange}
                    className="h-3.5 w-3.5 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <span className="text-xs text-gray-700">
                    Return to Supplier?
                  </span>
                </div>
              </div>

              <div className="mt-2">
                <label className="mb-0.5 block text-xs font-medium text-gray-700">
                  Notes
                </label>
                <textarea
                  name="notes"
                  value={form.notes}
                  onChange={onFormChange}
                  rows={2}
                  className="w-full rounded-md border border-gray-300 px-2 py-1.5 text-xs focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-200"
                />
              </div>

              <div className="mt-2 flex justify-end gap-1">
                <button
                  type="button"
                  onClick={closeForm}
                  className="rounded-md border border-gray-300 px-2.5 py-1.5 text-xs text-gray-700 transition hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-1 rounded-md bg-green-600 px-2.5 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-green-700"
                >
                  <FiSave size={12} /> {editing ? "Save" : "Add Part"}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Professional Table */}
        <div className="overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm">
          <div className="max-h-[calc(100vh-280px)] overflow-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="sticky top-0 z-10 bg-gray-50">
                <tr className="text-left text-xs font-medium uppercase tracking-wider text-gray-500">
                  <th className="px-5 py-2">Part</th>
                  <th className="px-3 py-2">Vehicle</th>
                  <th className="px-3 py-2">Supplier</th>
                  <th className="px-1 py-2 text-right">Qty</th>
                  <th className="px-5 py-2 text-right">Total</th>
                  <th className="px-6 py-2 text-right">Status</th>
                  <th className="px-3 py-2 text-right">Owner</th>
                  <th className="px-5 py-2 text-right">Date</th>
                  <th className="px-5 py-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 bg-white">
                {loading ? (
                  [...Array(6)].map((_, i) => (
                    <tr key={i} className="animate-pulse">
                      {Array.from({ length: 9 }).map((__, j) => (
                        <td key={j} className="px-3 py-3">
                          <div className="h-4 w-20 rounded bg-gray-200" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : parts.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="px-3 py-8 text-center">
                      <div className="mx-auto max-w-md">
                        <div className="mb-1 text-sm font-medium text-gray-700">
                          No parts found
                        </div>
                        <p className="text-gray-500 text-xs">
                          Try adjusting your search or filters
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  parts.map((part) => (
                    <tr key={part._id} className="hover:bg-gray-50">
                      <td className="px-3 py-2 max-w-[180px]">
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {part.partName}
                            </div>
                            {part.notes && (
                              <div className="mt-0.5 text-xs text-gray-500 line-clamp-1">
                                {part.notes}
                              </div>
                            )}
                            {part.returnToSupplier && part.returnReason && (
                              <div className="mt-0.5 text-xs text-red-600 truncate">
                                Returned: {part.returnReason}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>

                      <td className="px-3 py-2 max-w-[120px]">
                        <div className="text-sm text-gray-900 truncate">
                          {part.vehicleId}
                        </div>
                        {part.finNumber && (
                          <div className="text-xs text-gray-500 truncate">
                            FIN: {part.finNumber}
                          </div>
                        )}
                      </td>

                      <td className="px-3 py-2">
                        <div className="text-sm text-gray-900 truncate max-w-[100px]">
                          {part.supplier || "-"}
                        </div>
                      </td>
                      <td className="px-3 py-2 text-right text-sm text-gray-900">
                        {part.quantity}
                      </td>

                      <td className="px-3 py-2 text-right text-sm text-gray-900">
                        {currencyFmt(
                          Number(part.price || 0) * Number(part.quantity || 1),
                          part.currency || "EUR"
                        )}
                      </td>

                      <td className="px-3 py-2 text-right">
                        <select
                          value={part.status}
                          onChange={(e) =>
                            updateStatus(part._id, e.target.value)
                          }
                          disabled={part.status === "returned"}
                          className={`rounded-md border border-transparent text-xs focus:outline-none focus:ring-1 focus:ring-blue-200 ${
                            part.status === "pending"
                              ? "bg-gray-100"
                              : part.status === "ordered"
                              ? "bg-blue-100 text-blue-800"
                              : part.status === "received"
                              ? "bg-purple-100 text-purple-800"
                              : part.status === "installed"
                              ? "bg-green-100 text-green-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          <option value="pending">Pending</option>
                          <option value="ordered">Ordered</option>
                          <option value="received">Received</option>
                          <option value="installed">Installed</option>
                          <option value="returned" disabled>
                            Returned
                          </option>
                        </select>
                      </td>

                      <td className="px-3 py-2">
                        <div className="flex justify-end items-center gap-1">
                          <FiUser className="text-gray-500 text-xs" />
                          <span className="text-xs">{part.owner}</span>
                        </div>
                      </td>

                      <td className="px-3 py-2 text-xs text-right text-gray-500">
                        {part.createdAt
                          ? new Date(part.createdAt).toLocaleDateString()
                          : "--"}
                      </td>

                      <td className="px-3 py-2 text-right">
                        <div className="flex items-center justify-end gap-1">
                          {part.status !== "returned" && (
                            <button
                              onClick={() => markReturned(part._id)}
                              className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                              title="Mark returned"
                            >
                              <FiCornerUpLeft size={14} />
                            </button>
                          )}
                          <button
                            onClick={() => openEdit(part)}
                            className="rounded p-1 text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                            title="Edit"
                          >
                            <FiEdit3 size={14} />
                          </button>
                          <button
                            onClick={() => deletePart(part._id)}
                            className="rounded p-1 text-red-600 hover:bg-red-50"
                            title="Delete"
                          >
                            <FiTrash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Compact Pagination */}
          {parts.length > 0 && !loading && (
            <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-2 text-xs text-gray-600 border-t border-gray-200">
              <div className="flex items-center gap-1">
                <button
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      page: Math.max(1, p.page - 1),
                    }))
                  }
                  disabled={pagination.page === 1}
                  className="rounded border border-gray-300 p-1 disabled:opacity-50"
                  aria-label="Previous page"
                >
                  <FiChevronLeft size={14} />
                </button>

                {pageItems.map((item, idx) =>
                  item === "…" ? (
                    <span key={`e-${idx}`} className="px-1 select-none">
                      …
                    </span>
                  ) : (
                    <button
                      key={item}
                      onClick={() =>
                        setPagination((p) => ({ ...p, page: item }))
                      }
                      className={`rounded w-6 h-6 text-xs border ${
                        pagination.page === item
                          ? "border-blue-600 text-blue-700 font-medium"
                          : "border-gray-300 hover:bg-gray-100"
                      }`}
                    >
                      {item}
                    </button>
                  )
                )}

                <button
                  onClick={() =>
                    setPagination((p) => ({
                      ...p,
                      page: Math.min(p.pages, p.page + 1),
                    }))
                  }
                  disabled={pagination.page === pagination.pages}
                  className="rounded border border-gray-300 p-1 disabled:opacity-50"
                  aria-label="Next page"
                >
                  <FiChevronRight size={14} />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

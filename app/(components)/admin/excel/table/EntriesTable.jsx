// components/EntriesTable.jsx
"use client";

import React from "react";
import EntryRow from "./EntryRow";
import EmptyTableState from "./EmptyTableState";

const EntriesTable = ({
  entries,
  expandedEntry,
  toggleExpandEntry,
  handleEdit,
  handleDelete,
  handlePrint,
  handleExport,
  isFormExpanded,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <TableHeader>Datum</TableHeader>
            <TableHeader>Beschreibung</TableHeader>
            <TableHeader>Fahrzeug</TableHeader>
            <TableHeader>Einnahmen</TableHeader>
            <TableHeader>Ausgaben</TableHeader>
            <TableHeader>Saldo</TableHeader>
            <TableHeader align="right">Aktionen</TableHeader>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {entries.length > 0 ? (
            entries.map((entry) => (
              <EntryRow
                key={entry._id} // Use entry._id as the unique key
                entry={entry}
                isExpanded={expandedEntry === entry._id}
                toggleExpand={toggleExpandEntry}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onPrint={handlePrint}
                onExport={handleExport}
              />
            ))
          ) : (
            <EmptyTableState isFormExpanded={isFormExpanded} />
          )}
        </tbody>
      </table>
    </div>
  );
};

const TableHeader = ({ children, align = "left" }) => (
  <th
    scope="col"
    className={`px-6 py-3 text-${align} text-xs font-medium text-gray-500 uppercase tracking-wider`}
  >
    {children}
  </th>
);

export default EntriesTable;

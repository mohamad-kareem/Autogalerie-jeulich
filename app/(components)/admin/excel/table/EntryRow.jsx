
// components/EntryRow.jsx
"use client";

import React from "react";
import { FiEdit, FiTrash2, FiChevronUp, FiChevronDown } from "react-icons/fi";
import EntryDetails from "./EntryDetails";

const EntryRow = ({
  entry,
  isExpanded,
  toggleExpand,
  onEdit,
  onDelete,
  onPrint,
  onExport,
}) => {
  return (
    <React.Fragment>
      <tr
        className="hover:bg-lime-200 cursor-pointer"
        onClick={() => toggleExpand(entry._id)}
      >
        <TableCell>
          {new Date(entry.date).toLocaleDateString("de-DE", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
          })}
        </TableCell>
        <TableCell className="max-w-xs truncate">{entry.description}</TableCell>
        <TableCell>{entry.carName || "-"}</TableCell>
        <TableCell className="text-green-600 font-medium">
          {entry.income ? `€${parseFloat(entry.income).toFixed(2)}` : "-"}
        </TableCell>
        <TableCell className="text-red-600 font-medium">
          {entry.expense ? `€${parseFloat(entry.expense).toFixed(2)}` : "-"}
        </TableCell>
        <TableCell className="font-medium">
          €{parseFloat(entry.balance).toFixed(2)}
        </TableCell>
        <TableCell className="text-right">
          <div className="flex justify-end space-x-2">
            <ActionButton
              onClick={(e) => {
                e.stopPropagation();
                onEdit(entry._id);
                {
                  /* Changed to entry._id */
                }
              }}
              title="Bearbeiten"
            >
              <FiEdit />
            </ActionButton>
            <ActionButton
              onClick={(e) => {
                e.stopPropagation();
                onDelete(entry._id);
                {
                  /* Changed to entry._id */
                }
              }}
              title="Löschen"
            >
              <FiTrash2 />
            </ActionButton>
            <ActionButton
              onClick={(e) => {
                e.stopPropagation();
                toggleExpand(entry.id);
              }}
              title={isExpanded ? "Zuklappen" : "Aufklappen"}
            >
              {isExpanded ? <FiChevronUp /> : <FiChevronDown />}
            </ActionButton>
          </div>
        </TableCell>
      </tr>
      {isExpanded && (
        <tr className="bg-gray-50">
          <td colSpan="7" className="px-6 py-4">
            <EntryDetails entry={entry} onPrint={onPrint} onExport={onExport} />
          </td>
        </tr>
      )}
    </React.Fragment>
  );
};

const TableCell = ({ children, className = "" }) => (
  <td
    className={`px-6 py-4 whitespace-nowrap text-sm text-gray-900 ${className}`}
  >
    {children}
  </td>
);

const ActionButton = ({ children, onClick, title }) => (
  <button
    onClick={onClick}
    className="text-gray-600 hover:text-gray-900"
    title={title}
  >
    {children}
  </button>
);

export default EntryRow;

"use client";

import { useState } from "react";
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { toast } from "react-hot-toast";
import { FiTrash2, FiCalendar, FiX, FiChevronDown } from "react-icons/fi";

const DeleteByTimeRange = ({ onDeleted, darkMode }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [range, setRange] = useState({
    start: null,
    end: null,
  });

  const handleDelete = async () => {
    if (!range.start || !range.end) {
      toast.error("Please select both start and end dates");
      return;
    }

    if (range.start > range.end) {
      toast.error("End date must be after start date");
      return;
    }

    const confirmation = await new Promise((resolve) => {
      toast.custom(
        (t) => (
          <div
            className={`p-4 rounded-lg shadow-lg w-full max-w-sm ${
              darkMode ? "bg-gray-800" : "bg-white"
            } border ${darkMode ? "border-gray-700" : "border-gray-200"}`}
          >
            <p
              className={`mb-4 ${darkMode ? "text-gray-100" : "text-gray-800"}`}
            >
              Are you sure you want to delete all entries between
              <br />
              <span className="font-medium">
                {range.start?.toLocaleString()}
              </span>
              <br />
              and
              <br />
              <span className="font-medium">{range.end?.toLocaleString()}</span>
              ?
            </p>
            <div className="flex justify-end space-x-2">
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(false);
                }}
                className={`px-3 py-1.5 rounded text-sm ${
                  darkMode
                    ? "bg-gray-700 hover:bg-gray-600 text-gray-100"
                    : "bg-gray-100 hover:bg-gray-200 text-gray-800"
                }`}
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  toast.dismiss(t.id);
                  resolve(true);
                }}
                className="px-3 py-1.5 rounded text-sm bg-red-600 hover:bg-red-700 text-white"
              >
                Confirm Delete
              </button>
            </div>
          </div>
        ),
        { duration: Infinity }
      );
    });

    if (!confirmation) return;

    try {
      const res = await fetch("/api/plates/usage/delete-range", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          startTime: range.start,
          endTime: range.end,
        }),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || "Failed to delete entries");
      }

      const deletedIds = await res.json();
      onDeleted(deletedIds);
      setRange({ start: null, end: null });
      setIsOpen(false);
      toast.success("Entries deleted successfully");
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div
      className={`relative w-fit ${
        darkMode ? "text-gray-100" : "text-gray-800"
      }`}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-8 py-2.5 rounded-lg transition-all ${
          darkMode
            ? "bg-gray-700 hover:bg-gray-600"
            : "bg-white hover:bg-gray-50"
        } border ${darkMode ? "border-gray-600" : "border-gray-200"} shadow-sm`}
      >
        <div className="flex items-center space-x-2">
          <FiTrash2 className="text-red-500" />
          <span className="text-xs sm:text-base">Delete by range</span>
        </div>

        <FiChevronDown
          className={`transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </button>

      {isOpen && (
        <div
          className={`absolute top-full left-0 sm:right-0 mt-2 w-full max-w-sm z-10 rounded-lg shadow-lg ${
            darkMode ? "bg-gray-800" : "bg-white"
          } border ${darkMode ? "border-gray-700" : "border-gray-200"} p-4`}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-medium flex items-center text-sm sm:text-base">
              <FiCalendar className="mr-2" />
              Select Time Range
            </h3>
            <button
              onClick={() => setIsOpen(false)}
              className={`p-1 rounded-full ${
                darkMode ? "hover:bg-gray-700" : "hover:bg-gray-100"
              }`}
            >
              <FiX />
            </button>
          </div>

          <div className="space-y-4 text-sm">
            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-80">
                Start Date & Time
              </label>
              <DatePicker
                selected={range.start}
                onChange={(date) => setRange((r) => ({ ...r, start: date }))}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select start time"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  darkMode
                    ? "bg-gray-900 border-gray-600 focus:border-red-500"
                    : "border-gray-300 focus:border-red-400"
                } focus:ring-1 focus:ring-red-500/30 transition-colors`}
                popperPlacement="bottom-start"
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 opacity-80">
                End Date & Time
              </label>
              <DatePicker
                selected={range.end}
                onChange={(date) => setRange((r) => ({ ...r, end: date }))}
                showTimeSelect
                timeIntervals={15}
                dateFormat="MMMM d, yyyy h:mm aa"
                placeholderText="Select end time"
                className={`w-full px-3 py-2 rounded-lg border text-sm ${
                  darkMode
                    ? "bg-gray-900 border-gray-600 focus:border-red-500"
                    : "border-gray-300 focus:border-red-400"
                } focus:ring-1 focus:ring-red-500/30 transition-colors`}
                popperPlacement="bottom-start"
                minDate={range.start}
              />
            </div>

            <button
              onClick={handleDelete}
              disabled={!range.start || !range.end}
              className={`w-full py-2.5 px-4 rounded-lg font-medium flex items-center justify-center space-x-2 transition-colors ${
                !range.start || !range.end
                  ? darkMode
                    ? "bg-gray-700 text-gray-500 cursor-not-allowed"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                  : "bg-red-600 hover:bg-red-700 text-white"
              }`}
            >
              <FiTrash2 />
              <span>Delete Selected Range</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default DeleteByTimeRange;

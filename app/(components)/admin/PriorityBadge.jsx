// app/(Pages)/AdminDashboard/components/PriorityBadge.jsx
import React from "react";

const PriorityBadge = ({ priority }) => {
  const priorityStyles = {
    high: "bg-red-400 text-red-800",
    medium: "bg-green-400 text-green-800",
    low: "bg-gray-400 text-gray-800",
  };

  return (
    <span
      className={`px-2.5 py-1 inline-flex text-xs leading-4 font-medium rounded-full ${priorityStyles[priority]}`}
    >
      {priority === "high"
        ? "Hoch"
        : priority === "medium"
        ? "Mittel"
        : "Niedrig"}
    </span>
  );
};

export default PriorityBadge;

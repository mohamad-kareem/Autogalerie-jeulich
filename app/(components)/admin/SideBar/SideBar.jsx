// components/Sidebar.jsx
"use client";
import Link from "next/link";
import { FaCarAlt } from "react-icons/fa";
import {
  FiHome,
  FiPieChart,
  FiUsers,
  FiDollarSign,
  FiCalendar,
  FiLogOut,
} from "react-icons/fi";

const Sidebar = ({ user }) => {
  const menu = [
    { label: "Dashboard", href: "/dashboard", icon: <FiHome /> },
    { label: "Manage Tasks", href: "/admin/tasks", icon: <FiPieChart /> },
    { label: "Create Task", href: "/admin/create-task", icon: <FiCalendar /> },
    { label: "Team Members", href: "/admin/team", icon: <FiUsers /> },
    { label: "Neues Auto hinzufügen", href: "/addcar", icon: <FaCarAlt /> },
    { label: "Kassenbuch", href: "/excel", icon: <FiDollarSign /> },
    { label: "Kauftrags", href: "/Kauftrags", icon: <FiCalendar /> },
  ];

  return (
    <div className="w-64 h-screen bg-white shadow-lg flex flex-col">
      <div className="p-6 border-b">
        <div className="text-center">
          <div className="text-xl font-bold">{user.name}</div>
          <div className="text-sm text-gray-500">{user.email}</div>
          <div className="text-xs bg-blue-100 text-blue-700 rounded px-2 py-1 mt-2 inline-block">
            Admin
          </div>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-2">
        {menu.map((item, i) => (
          <Link
            key={i}
            href={item.href}
            className="flex items-center space-x-3 p-2 text-gray-700 hover:bg-gray-100 rounded"
          >
            {item.icon}
            <span>{item.label}</span>
          </Link>
        ))}
      </nav>
      <div className="p-4 border-t">
        <Link
          href="/logout"
          className="flex items-center space-x-3 text-red-500"
        >
          <FiLogOut />
          <span>Logout</span>
        </Link>
      </div>
    </div>
  );
};

export default Sidebar;

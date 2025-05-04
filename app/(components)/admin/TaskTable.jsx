// app/(Pages)/AdminDashboard/components/TasksTable.jsx
"use client";

import React from "react";
import {
  FiCalendar,
  FiEdit2,
  FiTrash2,
  FiCheck,
  FiX,
  FiChevronUp,
  FiChevronDown,
  FiUser,
  FiKey,
} from "react-icons/fi";
import Image from "next/image";
import PriorityBadge from "./PriorityBadge";

const SortIcon = ({ direction }) => {
  return direction === "asc" ? (
    <FiChevronUp size={14} className="text-gray-500" />
  ) : (
    <FiChevronDown size={14} className="text-gray-500" />
  );
};

const TasksTable = ({
  tasks,
  admins,
  isAddingTask,
  editingTaskId,
  expandedTaskId,
  taskForm,
  filters,
  sortConfig,
  onInputChange,
  onAddTask,
  onUpdateTask,
  onEditTask,
  onDeleteTask,
  onResetForm,
  onRequestSort,
  onToggleExpand,
}) => {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-300">
        <thead className="bg-gray-50">
          <tr>
            <th
              onClick={() => onRequestSort("car")}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-1">
                Fahrzeug
                {sortConfig.key === "car" && (
                  <SortIcon direction={sortConfig.direction} />
                )}
              </div>
            </th>
            <th
              onClick={() => onRequestSort("needs")}
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-1">
                Kategorie
                {sortConfig.key === "needs" && (
                  <SortIcon direction={sortConfig.direction} />
                )}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Beschreibung
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Zugewiesen
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Priorität
            </th>
            <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
              Aktionen
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {isAddingTask && (
            <tr className="bg-blue-50/50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  name="car"
                  value={taskForm.car}
                  onChange={onInputChange}
                  placeholder="Fahrzeug"
                  required
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  name="needs"
                  value={taskForm.needs}
                  onChange={onInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {needsOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  name="description"
                  value={taskForm.description}
                  onChange={onInputChange}
                  placeholder="Beschreibung"
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  name="assignedTo"
                  value={taskForm.assignedTo}
                  onChange={onInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Nicht zugewiesen</option>
                  {admins.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  name="priority"
                  value={taskForm.priority}
                  onChange={onInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                  onClick={onAddTask}
                  disabled={!taskForm.car.trim()}
                  className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
                  title="Speichern"
                >
                  <FiCheck />
                </button>
                <button
                  onClick={onResetForm}
                  className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  title="Abbrechen"
                >
                  <FiX />
                </button>
              </td>
            </tr>
          )}

          {editingTaskId && (
            <tr className="bg-blue-50/50">
              <td className="px-6 py-4 whitespace-nowrap">
                <input
                  type="text"
                  name="car"
                  value={taskForm.car}
                  onChange={onInputChange}
                  required
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  name="needs"
                  value={taskForm.needs}
                  onChange={onInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {needsOptions.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4">
                <input
                  type="text"
                  name="description"
                  value={taskForm.description}
                  onChange={onInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  name="assignedTo"
                  value={taskForm.assignedTo}
                  onChange={onInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm w-full focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Nicht zugewiesen</option>
                  {admins.map((admin) => (
                    <option key={admin._id} value={admin._id}>
                      {admin.name}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <select
                  name="priority"
                  value={taskForm.priority}
                  onChange={onInputChange}
                  className="border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {priorityOptions.map((option) => (
                    <option key={option} value={option}>
                      {option.charAt(0).toUpperCase() + option.slice(1)}
                    </option>
                  ))}
                </select>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-2">
                <button
                  onClick={onUpdateTask}
                  disabled={!taskForm.car.trim()}
                  className="p-2 text-white bg-green-600 hover:bg-green-700 rounded-lg disabled:opacity-50 transition-colors"
                  title="Speichern"
                >
                  <FiCheck />
                </button>
                <button
                  onClick={onResetForm}
                  className="p-2 text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors"
                  title="Abbrechen"
                >
                  <FiX />
                </button>
              </td>
            </tr>
          )}

          {tasks.map((task) => (
            <React.Fragment key={task.id}>
              <tr
                className="hover:bg-gray-50 cursor-pointer transition-colors"
                onClick={() => onToggleExpand(task.id)}
              >
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    {task.car}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-700 px-2 py-1 rounded-md bg-gray-100 inline-block">
                    {task.needs}
                  </div>
                </td>
                <td className="px-6 py-4">
                  <div className="text-sm text-gray-600 max-w-xs truncate">
                    {task.description}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  {task.assignedTo ? (
                    <div className="flex items-center">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2">
                        <Image
                          src={task.assignedTo.image}
                          alt={task.assignedTo.name}
                          fill
                          className="object-cover"
                        />
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-center text-gray-400">
                      <FiUser className="mr-2" />
                      <span className="text-sm">Nicht zugewiesen</span>
                    </div>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-1">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditTask(task.id);
                    }}
                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                    title="Bearbeiten"
                  >
                    <FiEdit2 />
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteTask(task.id);
                    }}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Löschen"
                  >
                    <FiTrash2 />
                  </button>
                </td>
              </tr>

              {expandedTaskId === task.id && (
                <tr className="bg-gray-50/50">
                  <td colSpan="6" className="px-6 py-4">
                    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {/* Description Section */}
                        <div className="md:col-span-2">
                          <div className="flex items-center mb-4">
                            <div className="w-3 h-3 bg-blue-500 rounded-full mr-3"></div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              Aufgabendetails
                            </h3>
                          </div>
                          <div className="prose prose-sm text-gray-600 max-w-none">
                            {task.description ? (
                              <div className="whitespace-pre-line bg-gray-50 p-4 rounded-lg">
                                {task.description}
                              </div>
                            ) : (
                              <div className="text-gray-400 italic bg-gray-50 p-4 rounded-lg">
                                Keine Beschreibung vorhanden
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Metadata Section */}
                        <div className="space-y-4">
                          <div className="flex items-center">
                            <div className="w-3 h-3 bg-purple-500 rounded-full mr-3"></div>
                            <h3 className="text-lg font-semibold text-gray-800">
                              Metadaten
                            </h3>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-1">
                                <FiCalendar className="text-gray-400" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">
                                  Erstellt am
                                </p>
                                <p className="text-sm text-gray-800">
                                  {new Date(task.createdAt).toLocaleDateString(
                                    "de-DE",
                                    {
                                      day: "2-digit",
                                      month: "2-digit",
                                      year: "numeric",
                                      hour: "2-digit",
                                      minute: "2-digit",
                                    }
                                  )}
                                </p>
                              </div>
                            </div>

                            {task.assignedBy && (
                              <div className="flex items-start">
                                <div className="flex-shrink-0 mt-1">
                                  <FiUser className="text-gray-400" />
                                </div>
                                <div className="ml-3">
                                  <p className="text-sm font-medium text-gray-500">
                                    Erstellt von
                                  </p>
                                  <div className="flex items-center mt-1">
                                    <div className="relative w-6 h-6 rounded-full overflow-hidden mr-2">
                                      <Image
                                        src={task.assignedBy.image}
                                        alt={task.assignedBy.name}
                                        fill
                                        className="object-cover"
                                      />
                                    </div>
                                    <p className="text-sm text-gray-800">
                                      {task.assignedBy.name}
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            <div className="flex items-start">
                              <div className="flex-shrink-0 mt-1">
                                <FiKey className="text-gray-400" />
                              </div>
                              <div className="ml-3">
                                <p className="text-sm font-medium text-gray-500">
                                  Priorität
                                </p>
                                <div className="mt-1">
                                  <PriorityBadge priority={task.priority} />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default TasksTable;

const needsOptions = [
  "Reklamation",
  "Abmelden",
  "Neu Gekauft",
  "Erledigen",
  "Termin",
  "Hassuna",
  "Fotos+inserieren",
  "Kunden",
  "verkauft",
];
const priorityOptions = ["low", "medium", "high"];

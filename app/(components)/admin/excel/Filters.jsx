// components/Filters.jsx
"use client";
import { FiSearch, FiChevronDown } from "react-icons/fi";

const Filters = ({
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
  searchTerm,
  setSearchTerm,
}) => (
  <div className="flex items-center space-x-4 mb-4 md:mb-0">
    <MonthYearDropdown
      filterMonth={filterMonth}
      setFilterMonth={setFilterMonth}
      filterYear={filterYear}
      setFilterYear={setFilterYear}
    />
    <SearchInput searchTerm={searchTerm} setSearchTerm={setSearchTerm} />
  </div>
);

const MonthYearDropdown = ({
  filterMonth,
  setFilterMonth,
  filterYear,
  setFilterYear,
}) => (
  <>
    <div className="relative">
      <select
        value={filterMonth}
        onChange={(e) => setFilterMonth(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
      >
        {Array.from({ length: 12 }, (_, i) => (
          <option key={i + 1} value={i + 1}>
            {new Date(2000, i, 1).toLocaleDateString("de-DE", {
              month: "long",
            })}
          </option>
        ))}
      </select>
      <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-700 pointer-events-none" />
    </div>
    <div className="relative">
      <select
        value={filterYear}
        onChange={(e) => setFilterYear(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-md pl-3 pr-8 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
      >
        {Array.from({ length: 10 }, (_, i) => (
          <option key={i} value={new Date().getFullYear() - 5 + i}>
            {new Date().getFullYear() - 5 + i}
          </option>
        ))}
      </select>
      <FiChevronDown className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-700 pointer-events-none" />
    </div>
  </>
);

const SearchInput = ({ searchTerm, setSearchTerm }) => (
  <div className="relative">
    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
      <FiSearch className="h-4 w-4 text-gray-400" />
    </div>
    <input
      type="text"
      placeholder="Einträge suchen..."
      className="pl-10 pr-4 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500"
      value={searchTerm}
      onChange={(e) => setSearchTerm(e.target.value)}
    />
  </div>
);

export default Filters;

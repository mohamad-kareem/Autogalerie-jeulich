// components/Tabs.jsx
"use client";

const Tabs = ({ activeTab, setActiveTab }) => (
  <div className="border-b border-gray-200">
    <nav className="flex -mb-px">
      {["einträge", "analytics"].map((tab) => (
        <TabButton
          key={tab}
          tab={tab}
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      ))}
    </nav>
  </div>
);

const TabButton = ({ tab, activeTab, setActiveTab }) => (
  <button
    onClick={() => setActiveTab(tab)}
    className={`py-4 px-6 text-center border-b-2 font-medium text-sm ${
      activeTab === tab
        ? "border-red-600 text-red-600"
        : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
    }`}
  >
    {tab.charAt(0).toUpperCase() + tab.slice(1)}
  </button>
);

export default Tabs;

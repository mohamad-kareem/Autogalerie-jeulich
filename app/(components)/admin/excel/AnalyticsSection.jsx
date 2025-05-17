// components/AnalyticsSection.jsx
"use client";

import React from "react";
import CashflowChart from "./CashflowChart";
import BalanceTrendChart from "./BalanceTrendChart";
import CategoriesChart from "./CategoriesChart";

const AnalyticsSection = ({ dailyData, categoryData }) => {
  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Cashflow</h3>
        <div className="bg-lime-200 p-4 rounded-lg border border-gray-200">
          <CashflowChart data={dailyData} />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">
            Saldoverlauf
          </h3>
          <div className="bg-lime-200 p-4 rounded-lg border border-gray-200">
            <BalanceTrendChart data={dailyData} />
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Kategorien</h3>
          <div className="bg-lime-200 p-4 rounded-lg border border-gray-200">
            <CategoriesChart data={categoryData} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalyticsSection;

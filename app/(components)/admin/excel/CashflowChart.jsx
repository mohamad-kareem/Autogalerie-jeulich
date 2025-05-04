// components/CashflowChart.jsx
"use client";

import React from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const CashflowChart = ({ data }) => {
  return (
    <div className="h-80">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="incomeColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
            </linearGradient>
            <linearGradient id="expenseColor" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
              <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E5E7EB"
          />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip
            formatter={(value, name) => [
              `€${value.toFixed(2)}`,
              name === "income" ? "Einnahmen" : "Ausgaben",
            ]}
          />
          <Legend />
          <Area
            type="monotone"
            dataKey="income"
            stroke="#10B981"
            fillOpacity={1}
            fill="url(#incomeColor)"
            name="Einnahmen"
          />
          <Area
            type="monotone"
            dataKey="expense"
            stroke="#EF4444"
            fillOpacity={1}
            fill="url(#expenseColor)"
            name="Ausgaben"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CashflowChart;

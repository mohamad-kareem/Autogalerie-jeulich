// components/CategoriesChart.jsx
"use client";

import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const CategoriesChart = ({ data }) => {
  return (
    <div className="h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data}>
          <CartesianGrid
            strokeDasharray="3 3"
            vertical={false}
            stroke="#E5E7EB"
          />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip formatter={(value) => [`€${value.toFixed(2)}`, "Betrag"]} />
          <Bar
            dataKey="value"
            fill="#8884d8"
            radius={[4, 4, 0, 0]}
            name="Betrag"
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CategoriesChart;

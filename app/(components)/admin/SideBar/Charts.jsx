// components/Charts.jsx
"use client";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const statusColors = ["#8b5cf6", "#0ea5e9", "#22c55e"];
const priorityColors = ["#10b981", "#f59e0b", "#ef4444"];

export const StatusDonut = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <PieChart>
      <Pie
        data={data}
        cx="50%"
        cy="50%"
        innerRadius={50}
        outerRadius={70}
        dataKey="value"
      >
        {data.map((_, index) => (
          <Cell key={index} fill={statusColors[index]} />
        ))}
      </Pie>
    </PieChart>
  </ResponsiveContainer>
);

export const PriorityBar = ({ data }) => (
  <ResponsiveContainer width="100%" height={200}>
    <BarChart data={data}>
      <XAxis dataKey="name" />
      <YAxis />
      <Tooltip />
      <Bar dataKey="value">
        {data.map((_, index) => (
          <Cell key={index} fill={priorityColors[index]} />
        ))}
      </Bar>
    </BarChart>
  </ResponsiveContainer>
);

"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface DataPoint {
  name: string;
  total: number;
}

const COLORS = ["#7c1c2e", "#a0253c", "#c42e4a", "#d4a017", "#e8b520", "#f0c84a", "#6b7280"];

function pesoK(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `₱${(value / 1_000).toFixed(0)}K`;
  return `₱${value.toFixed(0)}`;
}

export function SpendByCategoryChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink/40">No data yet.</p>;
  }

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart
        data={data}
        layout="vertical"
        margin={{ top: 4, right: 16, left: 8, bottom: 4 }}
      >
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e3df" horizontal={false} />
        <XAxis type="number" tickFormatter={pesoK} tick={{ fontSize: 11 }} />
        <YAxis
          type="category"
          dataKey="name"
          tick={{ fontSize: 10 }}
          width={110}
        />
        <Tooltip
          formatter={(value: unknown) =>
            `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
          }
        />
        <Bar dataKey="total" radius={[0, 3, 3, 0]}>
          {data.map((_, i) => (
            <Cell key={i} fill={COLORS[i % COLORS.length]} />
          ))}
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}

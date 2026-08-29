"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface DataPoint {
  label: string;
  approved: number;
  actual: number;
}

function pesoK(value: number) {
  if (value >= 1_000_000) return `₱${(value / 1_000_000).toFixed(1)}M`;
  if (value >= 1_000)     return `₱${(value / 1_000).toFixed(0)}K`;
  return `₱${value.toFixed(0)}`;
}

export function ApprovedVsActualChart({ data }: { data: DataPoint[] }) {
  if (data.length === 0) {
    return <p className="py-10 text-center text-sm text-ink/40">No data yet.</p>;
  }

  const chartData = data.map((d) => ({
    name:     d.label,
    Approved: d.approved,
    Actual:   d.actual,
  }));

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData} margin={{ top: 4, right: 8, left: 8, bottom: 4 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#e5e3df" />
        <XAxis dataKey="name" tick={{ fontSize: 11 }} />
        <YAxis tickFormatter={pesoK} tick={{ fontSize: 11 }} width={56} />
        <Tooltip
          formatter={(value: unknown) =>
            `₱${Number(value).toLocaleString("en-PH", { minimumFractionDigits: 2 })}`
          }
        />
        <Legend wrapperStyle={{ fontSize: 12 }} />
        <Bar dataKey="Approved" fill="#7c1c2e" radius={[3, 3, 0, 0]} />
        <Bar dataKey="Actual"   fill="#d4a017" radius={[3, 3, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  );
}

"use client";

const CARDS = [
  { key: "draft",            label: "Draft",            color: "border-l-gray-400",   bg: "bg-gray-50",   text: "text-gray-700"  },
  { key: "generated",        label: "Generated",        color: "border-l-blue-400",   bg: "bg-blue-50",   text: "text-blue-700"  },
  { key: "submitted_to_fao", label: "Submitted to FAO", color: "border-l-amber-400",  bg: "bg-amber-50",  text: "text-amber-700" },
  { key: "completed",        label: "Completed",        color: "border-l-green-500",  bg: "bg-green-50",  text: "text-green-700" },
] as const;

export function StatusCountCards({ counts }: { counts: Record<string, number> }) {
  const total = Object.values(counts).reduce((s, n) => s + n, 0);

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
      {CARDS.map((card) => (
        <div
          key={card.key}
          className={`rounded-lg border-l-4 ${card.color} ${card.bg} p-4 shadow-sm`}
        >
          <p className="text-xs font-medium text-ink/50">{card.label}</p>
          <p className={`mt-1 text-3xl font-bold ${card.text}`}>
            {counts[card.key] ?? 0}
          </p>
        </div>
      ))}
      <div className="col-span-2 rounded-lg border border-border bg-white p-4 shadow-sm sm:col-span-4 flex items-center gap-3">
        <p className="text-xs font-medium text-ink/50">Total Liquidations</p>
        <p className="text-2xl font-bold text-ink">{total}</p>
      </div>
    </div>
  );
}

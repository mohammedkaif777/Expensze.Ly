"use client";

import { formatCurrency } from "@/lib/utils";

interface TooltipEntry {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: { fill?: string };
}

interface ChartTooltipProps {
  active?: boolean;
  payload?: TooltipEntry[];
  label?: string | number;
}

export function ChartTooltip({ active, payload, label }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-popover px-3 py-2 text-xs shadow-md">
      {label !== undefined ? (
        <p className="mb-1 font-medium text-popover-foreground">{label}</p>
      ) : null}
      {payload.map((entry, i) => (
        <p key={i} className="flex items-center gap-2 text-muted-foreground">
          <span
            className="size-2 rounded-full"
            style={{ backgroundColor: entry.color || entry.payload?.fill }}
          />
          {entry.name}:{" "}
          <span className="font-medium text-foreground">
            {typeof entry.value === "number"
              ? formatCurrency(entry.value)
              : entry.value}
          </span>
        </p>
      ))}
    </div>
  );
}

export function ChartLegend({
  items,
}: {
  items: { name: string; value: number; color: string }[];
  formatter?: (value: number) => string;
}) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-2">
      {items.map((item) => (
        <div key={item.name} className="flex items-center gap-2 text-sm">
          <span
            className="size-2.5 rounded-full"
            style={{ backgroundColor: item.color }}
          />
          <span className="text-muted-foreground">{item.name}</span>
          <span className="font-medium">
            {formatCurrency(item.value)}
          </span>
        </div>
      ))}
    </div>
  );
}
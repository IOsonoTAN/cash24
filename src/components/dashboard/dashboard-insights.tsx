"use client";

import { useMemo, useState } from "react";
import { formatCurrency } from "@/lib/format";
import { Badge } from "@/components/ui/badge";

type ChartPoint = {
  label: string;
  fullDate: string;
  income: number;
  expense: number;
  transactions: number;
};

type DashboardInsightsProps = {
  points: ChartPoint[];
};

export function DashboardInsights({ points }: DashboardInsightsProps) {
  const [activeLabel, setActiveLabel] = useState(points.at(-1)?.label ?? points[0]?.label ?? "");
  const activePoint = useMemo(
    () => points.find((point) => point.label === activeLabel) ?? points.at(-1) ?? null,
    [activeLabel, points],
  );
  const maxChartValue = Math.max(1, ...points.flatMap((point) => [point.income, point.expense]));

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-border/60 bg-secondary/30 p-3">
        <p className="mb-3 text-sm font-medium">Last 7 days (Income vs Expense)</p>
        <div className="overflow-x-auto">
          <div className="grid min-w-[420px] grid-cols-7 gap-2">
            {points.map((point) => {
              const isActive = activePoint?.label === point.label;
              return (
                <button
                  key={point.label}
                  type="button"
                  className={`space-y-1 rounded-md p-1 text-left transition ${isActive ? "bg-background/70" : "hover:bg-background/40"}`}
                  onMouseEnter={() => setActiveLabel(point.label)}
                  onClick={() => setActiveLabel(point.label)}
                >
                  <div className="flex h-28 items-end justify-center gap-1 rounded-md bg-background/50 p-1">
                    <div
                      className="w-3 rounded-sm bg-emerald-500"
                      style={{ height: `${(point.income / maxChartValue) * 100}%` }}
                    />
                    <div
                      className="w-3 rounded-sm bg-rose-500"
                      style={{ height: `${(point.expense / maxChartValue) * 100}%` }}
                    />
                  </div>
                  <p className="text-center text-[10px] text-muted-foreground">{point.label}</p>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {activePoint ? (
        <div className="grid grid-cols-1 gap-3 rounded-lg border border-border/60 bg-secondary/40 p-3 sm:grid-cols-4">
          <div className="sm:col-span-4">
            <p className="text-sm font-medium">{activePoint.fullDate}</p>
            <p className="text-xs text-muted-foreground">Hover or tap another day to see detail</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-base font-semibold text-emerald-500">{formatCurrency(activePoint.income)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Expense</p>
            <p className="text-base font-semibold text-rose-500">{formatCurrency(activePoint.expense)}</p>
          </div>
          <div>
            <p className="text-xs text-muted-foreground">Net</p>
            <p className="text-base font-semibold">{formatCurrency(activePoint.income - activePoint.expense)}</p>
          </div>
          <div className="flex items-end">
            <Badge variant="secondary">{activePoint.transactions} transaction(s)</Badge>
          </div>
        </div>
      ) : null}
    </div>
  );
}

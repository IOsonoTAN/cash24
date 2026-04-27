"use client";

import { addMonths, format, parse } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type MonthlyControlsProps = {
  monthValue: string;
  currentTab: "calendar" | "installment";
};

export function MonthlyControls({
  monthValue,
  currentTab,
}: MonthlyControlsProps) {
  const router = useRouter();
  const monthDate = parse(monthValue, "yyyy-MM", new Date());
  const previousMonthValue = format(addMonths(monthDate, -1), "yyyy-MM");
  const nextMonthValue = format(addMonths(monthDate, 1), "yyyy-MM");

  return (
    <div className="flex flex-wrap items-center gap-2">
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground transition hover:bg-secondary/80"
        onClick={() =>
          router.push(
            `/reports/monthly?month=${previousMonthValue}&tab=${currentTab}`,
          )
        }
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </button>
      <div className="relative min-w-[220px] flex-1 sm:flex-none">
        <input
          name="month"
          type="month"
          value={monthValue}
          className="glass scheme-dark w-full cursor-pointer rounded-xl px-3 py-2 pr-9 text-sm [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          onChange={(event) =>
            router.push(
              `/reports/monthly?month=${event.target.value}&tab=${currentTab}`,
            )
          }
        />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
      </div>
      <button
        type="button"
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground transition hover:bg-secondary/80"
        onClick={() =>
          router.push(
            `/reports/monthly?month=${nextMonthValue}&tab=${currentTab}`,
          )
        }
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

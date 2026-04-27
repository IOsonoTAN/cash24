"use client";

import Link from "next/link";
import { format } from "date-fns";
import { Calendar, ChevronLeft, ChevronRight } from "lucide-react";
import { useRouter } from "next/navigation";

type DailyControlsProps = {
  selectedDateValue: string;
  previousDateValue: string;
  nextDateValue: string;
  monthlyValue: string;
};

export function DailyControls({
  selectedDateValue,
  previousDateValue,
  nextDateValue,
  monthlyValue,
}: DailyControlsProps) {
  const router = useRouter();

  return (
    <div className="mb-4 flex flex-wrap items-center gap-2">
      <Link
        href={`/reports/daily?date=${previousDateValue}`}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground transition hover:bg-secondary/80"
      >
        <ChevronLeft className="h-4 w-4" />
        Previous
      </Link>
      <div className="relative min-w-[220px] flex-1 sm:flex-none">
        <input
          name="date"
          type="date"
          value={selectedDateValue}
          className="glass scheme-dark w-full cursor-pointer rounded-xl px-3 py-2 pr-9 text-sm [&::-webkit-calendar-picker-indicator]:cursor-pointer [&::-webkit-calendar-picker-indicator]:opacity-0"
          max={format(new Date(), "yyyy-MM-dd")}
          onChange={(event) => router.push(`/reports/daily?date=${event.target.value}`)}
        />
        <Calendar className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground" />
      </div>
      <Link
        href={`/reports/daily?date=${nextDateValue}`}
        className="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground transition hover:bg-secondary/80"
      >
        Next
        <ChevronRight className="h-4 w-4" />
      </Link>
      <Link
        href={`/reports/monthly?month=${monthlyValue}`}
        className="ml-auto inline-flex cursor-pointer items-center rounded-xl border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground transition hover:bg-secondary/80"
      >
        Go to monthly
      </Link>
    </div>
  );
}

"use client";

import Link from "next/link";
import { format } from "date-fns";
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
        className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
      >
        Previous
      </Link>
      <input
        name="date"
        type="date"
        value={selectedDateValue}
        className="glass rounded-md px-3 py-2 text-sm"
        max={format(new Date(), "yyyy-MM-dd")}
        onChange={(event) => router.push(`/reports/daily?date=${event.target.value}`)}
      />
      <Link
        href={`/reports/daily?date=${nextDateValue}`}
        className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
      >
        Next
      </Link>
      <Link
        href={`/reports/monthly?month=${monthlyValue}`}
        className="ml-auto inline-flex rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
      >
        Go to monthly
      </Link>
    </div>
  );
}

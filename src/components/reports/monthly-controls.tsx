"use client";

import { addMonths, format, parse } from "date-fns";
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
        className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
        onClick={() =>
          router.push(
            `/reports/monthly?month=${previousMonthValue}&tab=${currentTab}`,
          )
        }
      >
        Previous
      </button>
      <input
        name="month"
        type="month"
        value={monthValue}
        className="glass rounded-md px-3 py-2 text-sm"
        onChange={(event) =>
          router.push(
            `/reports/monthly?month=${event.target.value}&tab=${currentTab}`,
          )
        }
      />
      <button
        type="button"
        className="rounded-md border border-border bg-secondary px-3 py-2 text-sm text-secondary-foreground"
        onClick={() =>
          router.push(
            `/reports/monthly?month=${nextMonthValue}&tab=${currentTab}`,
          )
        }
      >
        Next
      </button>
    </div>
  );
}

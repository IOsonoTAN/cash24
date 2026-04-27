import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { prisma } from "@/lib/prisma";
import { mapDailyMonthTotals, mapInstallmentsForMonth } from "@/lib/reporting";
import { getSession } from "@/lib/session";
import { MonthlyInstallmentTable } from "@/components/reports/monthly-installment-table";
import { MonthlyControls } from "@/components/reports/monthly-controls";
import {
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parse,
  startOfMonth,
  startOfWeek,
} from "date-fns";
import Link from "next/link";

type MonthlyPageProps = {
  searchParams: Promise<{ month?: string; tab?: string }>;
};

export default async function MonthlyReportPage({
  searchParams,
}: MonthlyPageProps) {
  const params = await searchParams;
  const monthValue = params.month ?? format(new Date(), "yyyy-MM");
  const currentTab = params.tab === "installment" ? "installment" : "calendar";
  const monthDate = parse(monthValue, "yyyy-MM", new Date());
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  const session = await getSession();
  const monthTransactions = await prisma.transaction.findMany({
    where: {
      userId: session!.user!.id,
      occurredAt: {
        gte: monthStart,
        lte: monthEnd,
      },
    },
  });
  const transactions = await prisma.transaction.findMany({
    where: {
      userId: session!.user!.id,
      isInstallment: true,
    },
    orderBy: {
      occurredAt: "asc",
    },
  });

  const rows = mapInstallmentsForMonth(transactions, monthDate);
  const totalDue = rows.reduce((sum, row) => sum + row.dueAmount, 0);
  const installmentDueTransactions = rows.length;
  const totalIncome = monthTransactions
    .filter((transaction) => transaction.kind === "INCOME")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = monthTransactions
    .filter((transaction) => transaction.kind === "EXPENSE")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const netAmount = totalIncome - totalExpense;
  const dailyTotals = mapDailyMonthTotals(monthTransactions);
  const calendarStart = startOfWeek(monthStart);
  const calendarEnd = endOfWeek(monthEnd);
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: calendarEnd,
  });
  const weekDays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Monthly report ({format(monthDate, "MMMM yyyy")})</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <MonthlyControls monthValue={monthValue} currentTab={currentTab} />
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">Income</p>
              <p className="text-xl font-semibold">
                {formatCurrency(totalIncome)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">Expense</p>
              <p className="text-xl font-semibold">
                {formatCurrency(totalExpense)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">Net</p>
              <p className="text-xl font-semibold">
                {formatCurrency(netAmount)}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">Transactions</p>
              <p className="text-xl font-semibold">
                {monthTransactions.length}
              </p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">Installment per month</p>
              <p className="text-xl font-semibold">{formatCurrency(totalDue)}</p>
            </div>
            <div className="rounded-lg bg-secondary/60 p-3">
              <p className="text-xs text-muted-foreground">Installment to pay</p>
              <p className="text-xl font-semibold">{installmentDueTransactions}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href={`/reports/monthly?month=${monthValue}&tab=calendar`}
              className={`rounded-full px-3 py-1.5 text-sm ${
                currentTab === "calendar"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              Calendar
            </Link>
            <Link
              href={`/reports/monthly?month=${monthValue}&tab=installment`}
              className={`rounded-full px-3 py-1.5 text-sm ${
                currentTab === "installment"
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground"
              }`}
            >
              Installment
            </Link>
          </div>
          {currentTab === "calendar" ? (
            <div className="space-y-2 rounded-lg border border-border/60 bg-background/30 p-3">
              <p className="text-sm font-medium">Calendar</p>
              <div className="overflow-x-auto pb-1">
                <div className="min-w-[700px]">
                  <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
                    {weekDays.map((day) => (
                      <div key={day} className="rounded-md py-1">
                        {day}
                      </div>
                    ))}
                  </div>
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((day) => {
                      const dayKey = format(day, "yyyy-MM-dd");
                      const totals = dailyTotals[dayKey];
                      const inMonth = isSameMonth(day, monthDate);
                      const hasIncome = (totals?.incomeTotal ?? 0) > 0;
                      const hasExpense = (totals?.expenseTotal ?? 0) > 0;
                      const hasData = hasIncome || hasExpense;
                      const content = (
                        <>
                          <p className="mb-1 font-semibold">
                            {format(day, "d")}
                          </p>
                          {inMonth && hasData ? (
                            <div className="space-y-0.5">
                              {hasIncome ? (
                                <p className="text-emerald-500">
                                  In: {formatCurrency(totals?.incomeTotal ?? 0)}
                                </p>
                              ) : null}
                              {hasExpense ? (
                                <p className="text-rose-500">
                                  Out: {formatCurrency(totals?.expenseTotal ?? 0)}
                                </p>
                              ) : null}
                            </div>
                          ) : null}
                        </>
                      );
                      return inMonth && hasData ? (
                        <Link
                          key={dayKey}
                          href={`/reports/daily?date=${dayKey}`}
                          className="min-h-18 rounded-md border border-border/70 bg-secondary/30 p-2 text-left text-xs transition hover:border-primary/60 hover:bg-secondary/50"
                        >
                          {content}
                        </Link>
                      ) : inMonth ? (
                        <div
                          key={dayKey}
                          className="min-h-18 rounded-md border border-border/50 bg-secondary/15 p-2 text-left text-xs"
                        >
                          {content}
                        </div>
                      ) : (
                        <div
                          key={dayKey}
                          className="min-h-18 rounded-md border border-border/30 bg-transparent p-2 text-left text-xs opacity-50"
                        >
                          {content}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold">Monthly Installment</p>
                <Separator />
              </div>
              <div className="rounded-lg bg-secondary/60 p-3">
                <p className="text-xs text-muted-foreground">
                  Total due this month
                </p>
                <p className="text-xl font-semibold">
                  {formatCurrency(totalDue)}
                </p>
                <p className="text-xs text-muted-foreground">
                  {installmentDueTransactions} transaction(s) to pay
                </p>
              </div>
              <MonthlyInstallmentTable
                rows={rows.map((row) => ({
                  ...row,
                  finishMonth: formatDateTime(row.finishMonth),
                }))}
              />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

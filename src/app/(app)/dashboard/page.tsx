import { endOfDay, format, startOfDay, subDays } from "date-fns";
import { getSession } from "@/lib/session";
import { getDailyReport } from "@/lib/reporting";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { prisma } from "@/lib/prisma";
import { DashboardInsights } from "@/components/dashboard/dashboard-insights";

export default async function DashboardPage() {
  const session = await getSession();
  const today = new Date();
  const last7Start = startOfDay(subDays(today, 6));
  const last7End = endOfDay(today);
  const [report, latestIncome, latestExpense, recentTransactions] = await Promise.all([
    getDailyReport(session!.user!.id, today),
    prisma.transaction.findFirst({
      where: {
        userId: session!.user!.id,
        kind: "INCOME",
      },
      orderBy: {
        occurredAt: "desc",
      },
    }),
    prisma.transaction.findFirst({
      where: {
        userId: session!.user!.id,
        kind: "EXPENSE",
      },
      orderBy: {
        occurredAt: "desc",
      },
    }),
    prisma.transaction.findMany({
      where: {
        userId: session!.user!.id,
        occurredAt: {
          gte: last7Start,
          lte: last7End,
        },
      },
      select: {
        occurredAt: true,
        amount: true,
        kind: true,
      },
      orderBy: {
        occurredAt: "asc",
      },
    }),
  ]);
  const dailyChart = Array.from({ length: 7 }).map((_, index) => {
    const day = subDays(today, 6 - index);
    const key = format(day, "yyyy-MM-dd");
    const dayTransactions = recentTransactions.filter(
      (transaction) => format(transaction.occurredAt, "yyyy-MM-dd") === key,
    );
    const income = dayTransactions
      .filter((transaction) => transaction.kind === "INCOME")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    const expense = dayTransactions
      .filter((transaction) => transaction.kind === "EXPENSE")
      .reduce((sum, transaction) => sum + transaction.amount, 0);
    return {
      label: format(day, "dd/MM"),
      fullDate: format(day, "dd MMMM yyyy"),
      income,
      expense,
      transactions: dayTransactions.length,
    };
  });

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Today ({formatDateTime(today)})</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <div className="rounded-lg bg-secondary/60 p-3">
            <p className="text-xs text-muted-foreground">Income</p>
            <p className="text-xl font-semibold">{formatCurrency(report.summary.income)}</p>
          </div>
          <div className="rounded-lg bg-secondary/60 p-3">
            <p className="text-xs text-muted-foreground">Expense</p>
            <p className="text-xl font-semibold">{formatCurrency(report.summary.expense)}</p>
          </div>
          <div className="rounded-lg bg-secondary/60 p-3">
            <p className="text-xs text-muted-foreground">Net</p>
            <p className="text-xl font-semibold">{formatCurrency(report.summary.net)}</p>
          </div>
        </CardContent>
      </Card>

      <Card className="glass">
        <CardHeader>
          <CardTitle>Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Latest income</p>
                <Badge>Income</Badge>
              </div>
              {latestIncome ? (
                <div className="mt-2 space-y-1">
                  <p className="text-lg font-semibold">{formatCurrency(latestIncome.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {latestIncome.name} • {formatDateTime(latestIncome.occurredAt)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No income transaction yet.</p>
              )}
            </div>
            <div className="rounded-lg border border-border/60 bg-secondary/40 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium">Latest expense</p>
                <Badge variant="secondary">Expense</Badge>
              </div>
              {latestExpense ? (
                <div className="mt-2 space-y-1">
                  <p className="text-lg font-semibold">{formatCurrency(latestExpense.amount)}</p>
                  <p className="text-xs text-muted-foreground">
                    {latestExpense.name} • {formatDateTime(latestExpense.occurredAt)}
                  </p>
                </div>
              ) : (
                <p className="mt-2 text-sm text-muted-foreground">No expense transaction yet.</p>
              )}
            </div>
          </div>
          <DashboardInsights points={dailyChart} />
        </CardContent>
      </Card>
    </div>
  );
}

import { parseISO, format } from "date-fns";
import { getSession } from "@/lib/session";
import { getDailyReport } from "@/lib/reporting";
import { formatCurrency } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionListTable } from "@/components/transaction/transaction-list-table";
import { DailyControls } from "@/components/reports/daily-controls";

type DailyPageProps = {
  searchParams: Promise<{ date?: string }>;
};

export default async function DailyReportPage({ searchParams }: DailyPageProps) {
  const params = await searchParams;
  const selectedDate = params.date ? parseISO(params.date) : new Date();
  const previousDateValue = format(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() - 1),
    "yyyy-MM-dd",
  );
  const nextDateValue = format(
    new Date(selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate() + 1),
    "yyyy-MM-dd",
  );
  const session = await getSession();
  const report = await getDailyReport(session!.user!.id, selectedDate);

  return (
    <div className="space-y-4">
      <Card className="glass">
        <CardHeader>
          <CardTitle>Daily account sheet ({format(selectedDate, "dd MMMM yyyy")})</CardTitle>
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
        <CardContent className="pt-6">
          <DailyControls
            selectedDateValue={format(selectedDate, "yyyy-MM-dd")}
            previousDateValue={previousDateValue}
            nextDateValue={nextDateValue}
            monthlyValue={format(selectedDate, "yyyy-MM")}
          />
          <TransactionListTable
            transactions={report.transactions.map((transaction) => ({
              id: transaction.id,
              kind: transaction.kind,
              category: transaction.category,
              occurredAt: transaction.occurredAt.toISOString(),
              name: transaction.name,
              description: transaction.description,
              amount: transaction.amount,
              paymentMethod: transaction.paymentMethod,
              recurrence: transaction.recurrence,
              isInstallment: transaction.isInstallment,
              installmentNoExpiry: transaction.installmentNoExpiry,
              installmentMonths: transaction.installmentMonths,
              installmentInterestPercent: transaction.installmentInterestPercent,
            }))}
            emptyLabel="No transactions for this date."
          />
        </CardContent>
      </Card>
    </div>
  );
}

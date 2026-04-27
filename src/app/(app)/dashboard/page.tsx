import { getSession } from "@/lib/session";
import { getDailyReport } from "@/lib/reporting";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TransactionListTable } from "@/components/transaction/transaction-list-table";

export default async function DashboardPage() {
  const session = await getSession();
  const today = new Date();
  const report = await getDailyReport(session!.user!.id, today);

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
          <CardTitle>Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          <TransactionListTable
            transactions={report.transactions.map((transaction) => ({
              id: transaction.id,
              kind: transaction.kind,
              category: transaction.category,
              occurredAt: transaction.occurredAt.toISOString(),
              name: transaction.name,
              description: transaction.description,
              amount: transaction.amount,
              isInstallment: transaction.isInstallment,
              installmentNoExpiry: transaction.installmentNoExpiry,
              installmentMonths: transaction.installmentMonths,
              installmentInterestPercent: transaction.installmentInterestPercent,
            }))}
            emptyLabel="No transactions yet."
          />
        </CardContent>
      </Card>
    </div>
  );
}

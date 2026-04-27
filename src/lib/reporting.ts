import { endOfDay, format, startOfDay } from "date-fns";
import { unstable_cache } from "next/cache";
import { Transaction } from "@prisma/client";
import { calculateInstallmentFinishMonth, projectInstallmentForMonth } from "@/lib/installment";
import { prisma } from "@/lib/prisma";

const getDailyReportCached = unstable_cache(
  async (userId: string, dayIso: string) => {
    const day = new Date(dayIso);
    const transactions = await prisma.transaction.findMany({
      where: {
        userId,
        occurredAt: {
          gte: startOfDay(day),
          lte: endOfDay(day),
        },
      },
      orderBy: {
        occurredAt: "desc",
      },
    });

    const income = transactions
      .filter((t) => t.kind === "INCOME")
      .reduce((sum, t) => sum + t.amount, 0);
    const expense = transactions
      .filter((t) => t.kind === "EXPENSE")
      .reduce((sum, t) => sum + t.amount, 0);

    return {
      transactions,
      summary: {
        income,
        expense,
        net: income - expense,
      },
    };
  },
  ["daily-report"],
  { tags: ["transactions"], revalidate: 30 },
);

const getMonthlyReportDataCached = unstable_cache(
  async (userId: string, monthKey: string) => {
    const monthDate = new Date(`${monthKey}-01T00:00:00`);
    const monthStart = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
    const monthEnd = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0, 23, 59, 59, 999);

    const [monthTransactions, installmentTransactions] = await Promise.all([
      prisma.transaction.findMany({
        where: {
          userId,
          occurredAt: {
            gte: monthStart,
            lte: monthEnd,
          },
        },
      }),
      prisma.transaction.findMany({
        where: {
          userId,
          isInstallment: true,
        },
        orderBy: {
          occurredAt: "asc",
        },
      }),
    ]);

    return {
      monthTransactions,
      installmentTransactions,
    };
  },
  ["monthly-report-data"],
  { tags: ["transactions"], revalidate: 30 },
);

export async function getDailyReport(userId: string, day: Date) {
  const cached = await getDailyReportCached(userId, day.toISOString());
  return {
    transactions: cached.transactions.map((transaction) => ({
      ...transaction,
      occurredAt: new Date(transaction.occurredAt),
    })),
    summary: cached.summary,
  };
}

export async function getMonthlyReportData(userId: string, monthKey: string) {
  const cached = await getMonthlyReportDataCached(userId, monthKey);
  return {
    monthTransactions: cached.monthTransactions.map((transaction) => ({
      ...transaction,
      occurredAt: new Date(transaction.occurredAt),
    })),
    installmentTransactions: cached.installmentTransactions.map((transaction) => ({
      ...transaction,
      occurredAt: new Date(transaction.occurredAt),
    })),
  };
}

export function buildMonthlyReportSummary(monthTransactions: Transaction[]) {
  const totalIncome = monthTransactions
    .filter((transaction) => transaction.kind === "INCOME")
    .reduce((sum, transaction) => sum + transaction.amount, 0);
  const totalExpense = monthTransactions
    .filter((transaction) => transaction.kind === "EXPENSE")
    .reduce((sum, transaction) => sum + transaction.amount, 0);

  return {
    totalIncome,
    totalExpense,
    netAmount: totalIncome - totalExpense,
  };
}

export function mapInstallmentsForMonth(transactions: Transaction[], monthDate: Date) {
  return transactions
    .filter((transaction) => transaction.isInstallment)
    .map((transaction) => {
      const noExpiry =
        "installmentNoExpiry" in transaction
          ? Boolean((transaction as Transaction & { installmentNoExpiry?: boolean }).installmentNoExpiry)
          : false;
      if (
        transaction.installmentInterestPercent === null ||
        transaction.installmentInterestPercent === undefined
      ) {
        return null;
      }
      if (!noExpiry && !transaction.installmentMonths) {
        return null;
      }
      const projected = projectInstallmentForMonth({
        amount: transaction.amount,
        months: transaction.installmentMonths,
        noExpiry,
        interestPercent: transaction.installmentInterestPercent,
        occurredAt: transaction.occurredAt,
        targetMonth: monthDate,
      });
      if (!projected) {
        return null;
      }
      return {
        id: transaction.id,
        transaction: {
          id: transaction.id,
          kind: transaction.kind,
          category: transaction.category,
          occurredAt: transaction.occurredAt.toISOString(),
          name: transaction.name,
          description: transaction.description,
          amount: transaction.amount,
          isInstallment: transaction.isInstallment,
          installmentNoExpiry: noExpiry,
          installmentMonths: transaction.installmentMonths ?? null,
          installmentInterestPercent: transaction.installmentInterestPercent ?? null,
        },
        name: transaction.name,
        dueAmount: projected.dueAmount,
        currentMonth: projected.currentMonth,
        totalMonths: noExpiry ? null : transaction.installmentMonths,
        progressLabel: noExpiry
          ? `${projected.currentMonth}/∞`
          : `${projected.currentMonth}/${transaction.installmentMonths}`,
        interestPercent: transaction.installmentInterestPercent,
        finishMonth: noExpiry
          ? null
          : calculateInstallmentFinishMonth(transaction.occurredAt, transaction.installmentMonths as number),
      };
    })
    .filter((value): value is NonNullable<typeof value> => Boolean(value));
}

export function mapDailyMonthTotals(transactions: Transaction[]) {
  return transactions.reduce<Record<string, { incomeTotal: number; expenseTotal: number; transactionCount: number }>>(
    (acc, transaction) => {
      const dayKey = format(transaction.occurredAt, "yyyy-MM-dd");
      const current = acc[dayKey] ?? { incomeTotal: 0, expenseTotal: 0, transactionCount: 0 };
      if (transaction.kind === "INCOME") {
        current.incomeTotal += transaction.amount;
      } else {
        current.expenseTotal += transaction.amount;
      }
      current.transactionCount += 1;
      acc[dayKey] = current;
      return acc;
    },
    {},
  );
}

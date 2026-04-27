import { endOfDay, format, startOfDay } from "date-fns";
import { Transaction } from "@prisma/client";
import { calculateInstallmentFinishMonth, projectInstallmentForMonth } from "@/lib/installment";
import { prisma } from "@/lib/prisma";

export async function getDailyReport(userId: string, day: Date) {
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
}

export function mapInstallmentsForMonth(transactions: Transaction[], monthDate: Date) {
  return transactions
    .filter((transaction) => transaction.isInstallment)
    .map((transaction) => {
      if (
        !transaction.installmentMonths ||
        transaction.installmentInterestPercent === null ||
        transaction.installmentInterestPercent === undefined
      ) {
        return null;
      }
      const projected = projectInstallmentForMonth({
        amount: transaction.amount,
        months: transaction.installmentMonths,
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
          installmentMonths: transaction.installmentMonths ?? null,
          installmentInterestPercent: transaction.installmentInterestPercent ?? null,
        },
        name: transaction.name,
        dueAmount: projected.dueAmount,
        currentMonth: projected.currentMonth,
        totalMonths: transaction.installmentMonths,
        interestPercent: transaction.installmentInterestPercent,
        finishMonth: calculateInstallmentFinishMonth(
          transaction.occurredAt,
          transaction.installmentMonths,
        ),
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

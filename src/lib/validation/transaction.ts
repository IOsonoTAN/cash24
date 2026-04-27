import { z } from "zod";

export const transactionKinds = ["EXPENSE", "INCOME"] as const;
export const paymentMethods = ["CASH", "CARD", "VOUCHER"] as const;
export const recurrenceFrequencies = [
  "NONE",
  "DAILY",
  "WEEKLY",
  "MONTHLY",
  "YEARLY",
] as const;
export const expenseCategories = [
  "EXPENSE_FOOD",
  "EXPENSE_BEVERAGE",
  "EXPENSE_SHIPPING",
  "EXPENSE_UTILITIES",
  "EXPENSE_TRANSPORT",
  "EXPENSE_HOUSING",
  "EXPENSE_HEALTH",
  "EXPENSE_EDUCATION",
  "EXPENSE_ENTERTAINMENT",
  "EXPENSE_SHOPPING",
  "EXPENSE_DEBT",
  "EXPENSE_OTHER",
] as const;
export const incomeCategories = [
  "INCOME_SALARY",
  "INCOME_BONUS",
  "INCOME_FREELANCE",
  "INCOME_INVESTMENT",
  "INCOME_INTEREST",
  "INCOME_REFUND",
  "INCOME_GIFT",
  "INCOME_OTHER",
] as const;
export const transactionCategories = [
  ...expenseCategories,
  ...incomeCategories,
] as const;
export const kindCategoryMap = {
  EXPENSE: expenseCategories,
  INCOME: incomeCategories,
} as const;

export const categoryLabelMap: Record<
  (typeof transactionCategories)[number],
  string
> = {
  EXPENSE_FOOD: "Food",
  EXPENSE_BEVERAGE: "Beverage",
  EXPENSE_SHIPPING: "Shipping",
  EXPENSE_UTILITIES: "Utilities",
  EXPENSE_TRANSPORT: "Transport",
  EXPENSE_HOUSING: "Housing",
  EXPENSE_HEALTH: "Health",
  EXPENSE_EDUCATION: "Education",
  EXPENSE_ENTERTAINMENT: "Entertainment",
  EXPENSE_SHOPPING: "Shopping",
  EXPENSE_DEBT: "Debt",
  EXPENSE_OTHER: "Other",
  INCOME_SALARY: "Salary",
  INCOME_BONUS: "Bonus",
  INCOME_FREELANCE: "Freelance",
  INCOME_INVESTMENT: "Investment",
  INCOME_INTEREST: "Interest",
  INCOME_REFUND: "Refund",
  INCOME_GIFT: "Gift",
  INCOME_OTHER: "Other",
};

export const paymentMethodLabelMap: Record<
  (typeof paymentMethods)[number],
  string
> = {
  CASH: "Cash",
  CARD: "Credit card",
  VOUCHER: "Voucher",
};
export const recurrenceLabelMap: Record<
  (typeof recurrenceFrequencies)[number],
  string
> = {
  NONE: "No repeat",
  DAILY: "Daily",
  WEEKLY: "Weekly",
  MONTHLY: "Monthly",
  YEARLY: "Yearly",
};

const amountRegex = /^\d{1,3}(,\d{3})*(\.\d{0,2})?$|^\d+(\.\d{0,2})?$/;
const timeRegex = /^([01]\d|2[0-3]):([0-5]\d)$/;

export const transactionInputSchema = z
  .object({
    kind: z.enum(transactionKinds),
    category: z.enum(transactionCategories),
    date: z.string().date(),
    time: z.string().regex(timeRegex),
    name: z.string().trim().min(1).max(120),
    description: z.string().trim().max(500).optional(),
    amount: z.string().trim().regex(amountRegex),
    paymentMethod: z.enum(paymentMethods),
    recurrence: z.enum(recurrenceFrequencies),
    isInstallment: z.boolean(),
    installmentNoExpiry: z.boolean().optional(),
    installmentMonths: z.number().int().min(1).max(84).optional(),
    installmentInterestPercent: z.number().min(0).max(999).optional(),
  })
  .superRefine((value, ctx) => {
    const allowedCategories = kindCategoryMap[value.kind];
    if (!allowedCategories.includes(value.category as never)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Category is not valid for this type.",
        path: ["category"],
      });
    }
    if (value.isInstallment) {
      if (!value.installmentNoExpiry && !value.installmentMonths) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Installment months is required.",
          path: ["installmentMonths"],
        });
      }
      if (value.installmentInterestPercent === undefined) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Installment interest is required.",
          path: ["installmentInterestPercent"],
        });
      }
    }
    const occurredAt = new Date(`${value.date}T${value.time}:00`);
    if (Number.isNaN(occurredAt.getTime()) || occurredAt > new Date()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Date and time cannot be in the future.",
        path: ["date"],
      });
    }
  });

export type TransactionInput = z.infer<typeof transactionInputSchema>;

export function parseAmount(value: string) {
  const normalized = value.replaceAll(",", "");
  return Number.parseFloat(normalized);
}

export function toOccurredAt(date: string, time: string) {
  return new Date(`${date}T${time}:00`);
}

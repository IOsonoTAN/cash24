import { PaymentMethod, RecurrenceFrequency, TransactionCategory, TransactionKind } from "@prisma/client";

export type TransactionRow = {
  id: string;
  kind: TransactionKind;
  category: TransactionCategory;
  occurredAt: string;
  name: string;
  description: string | null;
  amount: number;
  paymentMethod: PaymentMethod;
  recurrence: RecurrenceFrequency;
  isInstallment: boolean;
  installmentNoExpiry: boolean;
  installmentMonths: number | null;
  installmentInterestPercent: number | null;
};

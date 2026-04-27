import { TransactionCategory, TransactionKind } from "@prisma/client";

export type TransactionRow = {
  id: string;
  kind: TransactionKind;
  category: TransactionCategory;
  occurredAt: string;
  name: string;
  description: string | null;
  amount: number;
  isInstallment: boolean;
  installmentMonths: number | null;
  installmentInterestPercent: number | null;
};

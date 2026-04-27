"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency } from "@/lib/format";
import { TransactionDrawer } from "@/components/transaction/transaction-drawer";
import { TransactionRow } from "@/lib/transaction-types";

export type MonthlyInstallmentRow = {
  id: string;
  transaction: TransactionRow;
  name: string;
  dueAmount: number;
  currentMonth: number;
  totalMonths: number;
  interestPercent: number;
  finishMonth: string;
};

type MonthlyInstallmentTableProps = {
  rows: MonthlyInstallmentRow[];
};

export function MonthlyInstallmentTable({ rows }: MonthlyInstallmentTableProps) {
  const [selected, setSelected] = useState<MonthlyInstallmentRow | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Progress</TableHead>
            <TableHead>Interest</TableHead>
            <TableHead>Finish</TableHead>
            <TableHead className="text-right">Due amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No installment payment for this month.
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={row.id}
                className="cursor-pointer hover:bg-secondary/40"
                onClick={() => setSelected(row)}
              >
                <TableCell>{row.name}</TableCell>
                <TableCell>{`${row.currentMonth}/${row.totalMonths}`}</TableCell>
                <TableCell>{`${row.interestPercent}%`}</TableCell>
                <TableCell>{row.finishMonth}</TableCell>
                <TableCell className="text-right">{formatCurrency(row.dueAmount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TransactionDrawer
        mode="update"
        transaction={selected?.transaction}
        open={Boolean(selected)}
        onOpenChange={(open) => {
          if (!open) {
            setSelected(null);
          }
        }}
        hideTrigger
      />
    </>
  );
}

"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransactionDrawer } from "@/components/transaction/transaction-drawer";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { categoryLabelMap } from "@/lib/validation/transaction";
import { TransactionRow } from "@/lib/transaction-types";

type TransactionListTableProps = {
  transactions: TransactionRow[];
  emptyLabel: string;
};

export function TransactionListTable({ transactions, emptyLabel }: TransactionListTableProps) {
  const [selected, setSelected] = useState<TransactionRow | null>(null);

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Date & Time</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Type</TableHead>
            <TableHead className="text-right">Amount</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((transaction) => (
              <TableRow
                key={transaction.id}
                className="cursor-pointer hover:bg-secondary/40"
                onClick={() => setSelected(transaction)}
              >
                <TableCell>{formatDateTime(transaction.occurredAt)}</TableCell>
                <TableCell>{transaction.name}</TableCell>
                <TableCell>{categoryLabelMap[transaction.category]}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <Badge variant={transaction.kind === "INCOME" ? "default" : "secondary"}>
                      {transaction.kind}
                    </Badge>
                    {transaction.isInstallment ? <Badge variant="outline">Installment</Badge> : null}
                  </div>
                </TableCell>
                <TableCell className="text-right">{formatCurrency(transaction.amount)}</TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      <TransactionDrawer
        mode="update"
        transaction={selected ?? undefined}
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

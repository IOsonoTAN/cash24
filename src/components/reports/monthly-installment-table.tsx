"use client";

import { useMemo, useState } from "react";
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

type SortKey = "name" | "progress" | "interest" | "finishMonth" | "dueAmount";

export function MonthlyInstallmentTable({ rows }: MonthlyInstallmentTableProps) {
  const [selected, setSelected] = useState<MonthlyInstallmentRow | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("dueAmount");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");

  const displayedRows = useMemo(() => {
    return [...rows].sort((a, b) => {
      let result = 0;
      if (sortKey === "name") {
        result = a.name.localeCompare(b.name);
      } else if (sortKey === "progress") {
        result = a.currentMonth - b.currentMonth;
      } else if (sortKey === "interest") {
        result = a.interestPercent - b.interestPercent;
      } else if (sortKey === "finishMonth") {
        result = a.finishMonth.localeCompare(b.finishMonth);
      } else {
        result = a.dueAmount - b.dueAmount;
      }
      return sortDirection === "asc" ? result : -result;
    });
  }, [rows, sortKey, sortDirection]);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
      return;
    }
    setSortKey(key);
    setSortDirection("asc");
  };

  const sortLabel = (key: SortKey) => {
    if (sortKey !== key) {
      return "";
    }
    return sortDirection === "asc" ? " ↑" : " ↓";
  };

  return (
    <>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>
              <button type="button" onClick={() => handleSort("name")}>
                Name{sortLabel("name")}
              </button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => handleSort("progress")}>
                Progress{sortLabel("progress")}
              </button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => handleSort("interest")}>
                Interest{sortLabel("interest")}
              </button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => handleSort("finishMonth")}>
                Finish{sortLabel("finishMonth")}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button type="button" onClick={() => handleSort("dueAmount")}>
                Due amount{sortLabel("dueAmount")}
              </button>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedRows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground">
                No installment payment for this month.
              </TableCell>
            </TableRow>
          ) : (
            displayedRows.map((row) => (
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

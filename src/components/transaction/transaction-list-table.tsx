"use client";

import { TransactionDrawer } from "@/components/transaction/transaction-drawer";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { formatCurrency, formatDateTime } from "@/lib/format";
import { TransactionRow } from "@/lib/transaction-types";
import {
  categoryLabelMap,
  paymentMethodLabelMap,
  recurrenceLabelMap,
} from "@/lib/validation/transaction";
import { format } from "date-fns";
import { Banknote, CreditCard, Ticket } from "lucide-react";
import { useMemo, useState } from "react";

type TransactionListTableProps = {
  transactions: TransactionRow[];
  emptyLabel: string;
};

type SortKey =
  | "occurredAt"
  | "name"
  | "category"
  | "kind"
  | "paymentMethod"
  | "amount";

export function TransactionListTable({
  transactions,
  emptyLabel,
}: TransactionListTableProps) {
  const [selected, setSelected] = useState<TransactionRow | null>(null);
  const [sortKey, setSortKey] = useState<SortKey>("occurredAt");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("desc");
  const [timeFilter, setTimeFilter] = useState("all");
  const [nameFilter, setNameFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [amountFilter, setAmountFilter] = useState("");

  const timeOptions = useMemo(() => {
    return Array.from(
      new Set(
        transactions.map((transaction) =>
          format(new Date(transaction.occurredAt), "HH:mm"),
        ),
      ),
    ).sort((a, b) => a.localeCompare(b));
  }, [transactions]);

  const categoryOptions = useMemo(() => {
    return Array.from(
      new Set(
        transactions.map(
          (transaction) => `${transaction.category}|${transaction.kind}`,
        ),
      ),
    )
      .map((option) => {
        const [category, kind] = option.split("|");
        return {
          value: category,
          label: `${kind === "INCOME" ? "Income" : "Expense"} - ${categoryLabelMap[category as keyof typeof categoryLabelMap]}`,
        };
      })
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [transactions]);

  const displayedTransactions = useMemo(() => {
    const filtered = transactions.filter((transaction) => {
      const timeText = format(new Date(transaction.occurredAt), "HH:mm");
      const nameText = transaction.name.toLowerCase();
      const categoryText = transaction.category;
      const typeText = transaction.kind.toLowerCase();
      const amountText = String(transaction.amount);

      return (
        (timeFilter === "all" || timeText === timeFilter) &&
        nameText.includes(nameFilter.toLowerCase()) &&
        (categoryFilter === "all" || categoryText === categoryFilter) &&
        (typeFilter === "all" || typeText === typeFilter.toLowerCase()) &&
        amountText.includes(amountFilter)
      );
    });

    return filtered.sort((a, b) => {
      let result = 0;
      if (sortKey === "occurredAt") {
        result =
          new Date(a.occurredAt).getTime() - new Date(b.occurredAt).getTime();
      } else if (sortKey === "name") {
        result = a.name.localeCompare(b.name);
      } else if (sortKey === "category") {
        result = categoryLabelMap[a.category].localeCompare(
          categoryLabelMap[b.category],
        );
      } else if (sortKey === "kind") {
        result = a.kind.localeCompare(b.kind);
      } else if (sortKey === "paymentMethod") {
        result = a.paymentMethod.localeCompare(b.paymentMethod);
      } else {
        result = a.amount - b.amount;
      }
      return sortDirection === "asc" ? result : -result;
    });
  }, [
    transactions,
    sortKey,
    sortDirection,
    timeFilter,
    nameFilter,
    categoryFilter,
    typeFilter,
    amountFilter,
  ]);

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
          <TableRow className="bg-muted/30">
            <TableHead>
              <button type="button" onClick={() => handleSort("occurredAt")}>
                Date & Time{sortLabel("occurredAt")}
              </button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => handleSort("name")}>
                Name{sortLabel("name")}
              </button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => handleSort("category")}>
                Category{sortLabel("category")}
              </button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => handleSort("kind")}>
                Type{sortLabel("kind")}
              </button>
            </TableHead>
            <TableHead>
              <button type="button" onClick={() => handleSort("paymentMethod")}>
                Payment{sortLabel("paymentMethod")}
              </button>
            </TableHead>
            <TableHead className="text-right">
              <button type="button" onClick={() => handleSort("amount")}>
                Amount{sortLabel("amount")}
              </button>
            </TableHead>
          </TableRow>
          <TableRow>
            <TableHead>
              <Select
                value={timeFilter}
                onValueChange={(value) => setTimeFilter(value ?? "all")}
              >
                <SelectTrigger className="h-9 border-border bg-white text-foreground shadow-sm dark:border-border dark:bg-slate-900/70">
                  <SelectValue>
                    {timeFilter === "all" ? "All times" : timeFilter}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All times</SelectItem>
                  {timeOptions.map((time) => (
                    <SelectItem key={time} value={time}>
                      {time}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead>
              <Input
                className="h-9 border-border bg-white text-foreground placeholder:text-muted-foreground/80 shadow-sm dark:border-border dark:bg-slate-900/70"
                value={nameFilter}
                onChange={(event) => setNameFilter(event.target.value)}
                placeholder="Filter name"
              />
            </TableHead>
            <TableHead>
              <Select
                value={categoryFilter}
                onValueChange={(value) => setCategoryFilter(value ?? "all")}
              >
                <SelectTrigger className="h-9 border-border bg-white text-foreground shadow-sm dark:border-border dark:bg-slate-900/70">
                  <SelectValue>
                    {categoryFilter === "all"
                      ? "All categories"
                      : (categoryOptions.find(
                          (option) => option.value === categoryFilter,
                        )?.label ?? "All categories")}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categoryOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead>
              <Select
                value={typeFilter}
                onValueChange={(value) => setTypeFilter(value ?? "all")}
              >
                <SelectTrigger className="h-9 border-border bg-white text-foreground shadow-sm dark:border-border dark:bg-slate-900/70">
                  <SelectValue>
                    {typeFilter === "all"
                      ? "All types"
                      : typeFilter === "INCOME"
                        ? "Income"
                        : "Expense"}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  <SelectItem value="INCOME">Income</SelectItem>
                  <SelectItem value="EXPENSE">Expense</SelectItem>
                </SelectContent>
              </Select>
            </TableHead>
            <TableHead />
            <TableHead>
              <Input
                className="h-9 border-border bg-white text-foreground placeholder:text-muted-foreground/80 shadow-sm dark:border-border dark:bg-slate-900/70"
                value={amountFilter}
                onChange={(event) => setAmountFilter(event.target.value)}
                placeholder="Filter amount"
              />
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {displayedTransactions.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="text-center text-muted-foreground"
              >
                {emptyLabel}
              </TableCell>
            </TableRow>
          ) : (
            displayedTransactions.map((transaction) => (
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
                    <Badge
                      variant={
                        transaction.kind === "INCOME" ? "default" : "secondary"
                      }
                    >
                      {transaction.kind}
                    </Badge>
                    {transaction.isInstallment ? (
                      <Badge variant="outline">
                        {transaction.installmentNoExpiry
                          ? "Fixed cost"
                          : "Installment"}
                      </Badge>
                    ) : null}
                    {transaction.recurrence !== "NONE" ? (
                      <Badge variant="outline">
                        {recurrenceLabelMap[transaction.recurrence]}
                      </Badge>
                    ) : null}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="inline-flex items-center gap-1 text-xs">
                    {transaction.paymentMethod === "CASH" ? (
                      <Banknote className="h-3.5 w-3.5" />
                    ) : null}
                    {transaction.paymentMethod === "CREDIT_CARD" ? (
                      <CreditCard className="h-3.5 w-3.5" />
                    ) : null}
                    {transaction.paymentMethod === "VOUCHER" ? (
                      <Ticket className="h-3.5 w-3.5" />
                    ) : null}
                    <span>
                      {paymentMethodLabelMap[transaction.paymentMethod]}
                    </span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  {formatCurrency(transaction.amount)}
                </TableCell>
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

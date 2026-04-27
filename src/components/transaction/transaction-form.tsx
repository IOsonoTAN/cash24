"use client";

import { useMemo, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, useWatch } from "react-hook-form";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { sanitizeAmountInput } from "@/lib/format";
import { enqueueTransaction } from "@/lib/offline/queue";
import {
  categoryLabelMap,
  kindCategoryMap,
  TransactionInput,
  transactionInputSchema,
  transactionKinds,
} from "@/lib/validation/transaction";
import { TransactionRow } from "@/lib/transaction-types";

type TransactionFormProps = {
  mode: "create" | "update";
  transaction?: TransactionRow;
  onComplete: () => void;
};

const now = new Date();
const defaultDate = format(now, "yyyy-MM-dd");
const defaultTime = format(now, "HH:mm");

export function TransactionForm({ mode, transaction, onComplete }: TransactionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isQueued, setIsQueued] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const initialDate = transaction ? format(new Date(transaction.occurredAt), "yyyy-MM-dd") : defaultDate;
  const initialTime = transaction ? format(new Date(transaction.occurredAt), "HH:mm") : defaultTime;
  const initialKind = transaction?.kind ?? "EXPENSE";
  const initialCategory = transaction?.category ?? "EXPENSE_FOOD";

  const form = useForm<TransactionInput>({
    resolver: zodResolver(transactionInputSchema),
    defaultValues: {
      kind: initialKind,
      category: initialCategory,
      date: initialDate,
      time: initialTime,
      name: transaction?.name ?? "",
      description: transaction?.description ?? "",
      amount: transaction ? `${transaction.amount}` : "",
      isInstallment: transaction?.isInstallment ?? false,
      installmentMonths: transaction?.installmentMonths ?? undefined,
      installmentInterestPercent: transaction?.installmentInterestPercent ?? undefined,
    },
  });

  const isInstallment = useWatch({
    control: form.control,
    name: "isInstallment",
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const category = useWatch({ control: form.control, name: "category" });
  const amount = useWatch({ control: form.control, name: "amount" });
  const installmentMonths = useWatch({ control: form.control, name: "installmentMonths" });
  const installmentInterestPercent = useWatch({
    control: form.control,
    name: "installmentInterestPercent",
  });
  const categoryOptions = useMemo(() => kindCategoryMap[kind], [kind]);
  const uniqueCategoryOptions = useMemo(() => {
    const seen = new Set<string>();
    return categoryOptions.filter((option) => {
      const label = categoryLabelMap[option];
      if (seen.has(label)) {
        return false;
      }
      seen.add(label);
      return true;
    });
  }, [categoryOptions]);

  const maxDate = useMemo(() => format(new Date(), "yyyy-MM-dd"), []);

  const onSubmit = form.handleSubmit(async (values) => {
    setSubmitError(null);
    setIsQueued(false);
    if (!navigator.onLine) {
      if (mode === "update") {
        setSubmitError("Update is not available offline.");
        return;
      }
      await enqueueTransaction(values);
      setIsQueued(true);
      form.reset({
        ...values,
        name: "",
        description: "",
        amount: "",
      });
      onComplete();
      return;
    }
    if (mode === "update" && !transaction?.id) {
      setSubmitError("Cannot update transaction: missing id.");
      return;
    }
    const endpoint = mode === "create" ? "/api/transactions" : `/api/transactions/${transaction!.id}`;
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(values),
      });
    } catch {
      setSubmitError("Network error. Please try again.");
      return;
    }
    if (!response.ok) {
      if (response.status === 401) {
        setSubmitError("Session expired. Please sign in again.");
        return;
      }
      let message = "Cannot save transaction.";
      try {
        const data = (await response.json()) as { message?: string };
        message = data.message ?? message;
      } catch {
        try {
          const text = await response.text();
          if (text) {
            message = text;
          }
        } catch {}
      }
      setSubmitError(message);
      return;
    }
    if (mode === "create") {
      form.reset({
        kind: values.kind,
        category: values.category,
        date: defaultDate,
        time: defaultTime,
        name: "",
        description: "",
        amount: "",
        isInstallment: false,
        installmentMonths: undefined,
        installmentInterestPercent: undefined,
      });
    }
    onComplete();
  });

  const handleDelete = async () => {
    if (mode !== "update" || !transaction?.id) {
      return;
    }
    const confirmed = window.confirm("Delete this transaction?");
    if (!confirmed) {
      return;
    }
    setSubmitError(null);
    setIsDeleting(true);
    try {
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) {
        let message = "Cannot delete transaction.";
        try {
          const data = (await response.json()) as { message?: string };
          message = data.message ?? message;
        } catch {}
        setSubmitError(message);
        return;
      }
      onComplete();
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4" onSubmit={onSubmit}>
      <p className="text-xs text-muted-foreground">Fields marked with <span className="text-destructive">*</span> are required.</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>Type <span className="text-destructive">*</span></Label>
          <Select
            value={kind}
            onValueChange={(value) => {
              const nextKind = value as TransactionInput["kind"];
              form.setValue("kind", nextKind);
              form.setValue("category", kindCategoryMap[nextKind][0]);
            }}
          >
            <SelectTrigger className="w-full bg-background/75">
              <SelectValue>{kind === "INCOME" ? "Income" : "Expense"}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {transactionKinds.map((kind) => (
                <SelectItem key={kind} value={kind}>
                  {kind}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label>Category <span className="text-destructive">*</span></Label>
          <Select
            value={category}
            onValueChange={(value) =>
              form.setValue("category", value as TransactionInput["category"])
            }
          >
            <SelectTrigger className="w-full bg-background/75">
              <SelectValue>{categoryLabelMap[category]}</SelectValue>
            </SelectTrigger>
            <SelectContent>
              {uniqueCategoryOptions.map((category) => (
                <SelectItem key={category} value={category}>
                  {categoryLabelMap[category]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label htmlFor="date">Date <span className="text-destructive">*</span></Label>
          <Input
            id="date"
            type="date"
            max={maxDate}
            className="bg-background/75"
            {...form.register("date")}
            aria-invalid={Boolean(form.formState.errors.date)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">Time (HH:mm) <span className="text-destructive">*</span></Label>
          <Input
            id="time"
            type="time"
            className="bg-background/75"
            {...form.register("time")}
            aria-invalid={Boolean(form.formState.errors.time)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">Name <span className="text-destructive">*</span></Label>
        <Input
          id="name"
          className="bg-background/75"
          {...form.register("name")}
          aria-invalid={Boolean(form.formState.errors.name)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea id="description" className="bg-background/75" {...form.register("description")} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">Amount <span className="text-destructive">*</span></Label>
        <Input
          id="amount"
          className="bg-background/75"
          value={amount}
          inputMode="decimal"
          onChange={(event) => {
            const sanitized = sanitizeAmountInput(event.target.value);
            if (sanitized !== null) {
              form.setValue("amount", sanitized, { shouldValidate: true });
            }
          }}
          aria-invalid={Boolean(form.formState.errors.amount)}
        />
      </div>

      <div className="flex items-center justify-between rounded-md border border-border/50 px-3 py-2">
        <Label htmlFor="isInstallment">Installment</Label>
        <Switch
          id="isInstallment"
          checked={isInstallment}
          onCheckedChange={(checked) => {
            form.setValue("isInstallment", checked, { shouldValidate: true });
            if (!checked) {
              form.setValue("installmentMonths", undefined);
              form.setValue("installmentInterestPercent", undefined);
            }
          }}
        />
      </div>

      {isInstallment ? (
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="installmentMonths">Months <span className="text-destructive">*</span></Label>
            <Input
              id="installmentMonths"
              type="number"
              min={1}
              max={84}
              className="bg-background/75"
              value={installmentMonths ?? ""}
              onChange={(event) =>
                form.setValue(
                  "installmentMonths",
                  event.target.value ? Number(event.target.value) : undefined,
                  {
                    shouldValidate: true,
                  },
                )
              }
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="installmentInterestPercent">Interest (%) <span className="text-destructive">*</span></Label>
            <Input
              id="installmentInterestPercent"
              type="number"
              min={0}
              step="0.01"
              className="bg-background/75"
              value={installmentInterestPercent ?? ""}
              onChange={(event) =>
                form.setValue(
                  "installmentInterestPercent",
                  event.target.value ? Number(event.target.value) : undefined,
                  {
                    shouldValidate: true,
                  },
                )
              }
            />
          </div>
        </div>
      ) : null}

      {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
      {isQueued ? <p className="text-sm text-emerald-600">Saved offline and pending sync.</p> : null}

      {Object.values(form.formState.errors).length > 0 ? (
        <p className="text-sm text-destructive">Please check required fields and values.</p>
      ) : null}

      <div className="flex w-full gap-2">
        <Button
          className={mode === "update" ? "min-w-0 flex-7" : "w-full"}
          type="submit"
          disabled={form.formState.isSubmitting || isDeleting}
        >
          {form.formState.isSubmitting
            ? "Saving..."
            : mode === "create"
              ? "Save transaction"
              : "Update transaction"}
        </Button>
        {mode === "update" ? (
          <Button
            type="button"
            variant="destructive"
            className="min-w-0 flex-3"
            disabled={isDeleting || form.formState.isSubmitting}
            onClick={() => void handleDelete()}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        ) : null}
      </div>
    </form>
  );
}

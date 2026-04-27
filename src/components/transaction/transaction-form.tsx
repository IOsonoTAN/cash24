"use client";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { sanitizeAmountInput } from "@/lib/format";
import { enqueueTransaction } from "@/lib/offline/queue";
import { TransactionRow } from "@/lib/transaction-types";
import { cn } from "@/lib/utils";
import {
  categoryLabelMap,
  kindCategoryMap,
  recurrenceFrequencies,
  recurrenceLabelMap,
  TransactionInput,
  transactionInputSchema,
  transactionKinds,
} from "@/lib/validation/transaction";
import { zodResolver } from "@hookform/resolvers/zod";
import { format } from "date-fns";
import {
  Banknote,
  CreditCard,
} from "lucide-react";
import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";

type TransactionFormProps = {
  mode: "create" | "update";
  transaction?: TransactionRow;
  onComplete: () => void;
};

const now = new Date();
const defaultDate = format(now, "yyyy-MM-dd");
const defaultTime = format(now, "HH:mm");

export function TransactionForm({
  mode,
  transaction,
  onComplete,
}: TransactionFormProps) {
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isQueued, setIsQueued] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleteSuccessDialogOpen, setIsDeleteSuccessDialogOpen] =
    useState(false);

  const initialDate = transaction
    ? format(new Date(transaction.occurredAt), "yyyy-MM-dd")
    : defaultDate;
  const initialTime = transaction
    ? format(new Date(transaction.occurredAt), "HH:mm")
    : defaultTime;
  const initialKind = transaction?.kind ?? "EXPENSE";
  const initialCategory = transaction?.category ?? "EXPENSE_FOOD";
  const initialPaymentMethod: TransactionInput["paymentMethod"] =
    transaction?.paymentMethod === "CASH"
      ? "CASH"
      : transaction?.paymentMethod === "CREDIT_CARD"
        ? "CARD"
        : "CASH";

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
      paymentMethod: initialPaymentMethod,
      recurrence: transaction?.recurrence ?? "NONE",
      isInstallment: transaction?.isInstallment ?? false,
      installmentNoExpiry: transaction?.installmentNoExpiry ?? false,
      installmentMonths: transaction?.installmentMonths ?? undefined,
      installmentInterestPercent:
        transaction?.installmentInterestPercent ?? undefined,
    },
  });

  const isInstallment = useWatch({
    control: form.control,
    name: "isInstallment",
  });
  const kind = useWatch({ control: form.control, name: "kind" });
  const category = useWatch({ control: form.control, name: "category" });
  const amount = useWatch({ control: form.control, name: "amount" });
  const paymentMethod = useWatch({
    control: form.control,
    name: "paymentMethod",
  });
  const recurrence = useWatch({ control: form.control, name: "recurrence" });
  const installmentMonths = useWatch({
    control: form.control,
    name: "installmentMonths",
  });
  const installmentInterestPercent = useWatch({
    control: form.control,
    name: "installmentInterestPercent",
  });
  const installmentNoExpiry = useWatch({
    control: form.control,
    name: "installmentNoExpiry",
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
    const endpoint =
      mode === "create"
        ? "/api/transactions"
        : `/api/transactions/${transaction!.id}`;
    const payload = {
      ...values,
      installmentNoExpiry: values.isInstallment
        ? (values.installmentNoExpiry ?? false)
        : false,
      installmentMonths:
        values.isInstallment && !values.installmentNoExpiry
          ? values.installmentMonths
          : undefined,
    };
    let response: Response;
    try {
      response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(payload),
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
        paymentMethod: values.paymentMethod,
        recurrence: values.recurrence,
        isInstallment: false,
        installmentNoExpiry: false,
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
      setIsDeleteDialogOpen(false);
      setIsDeleteSuccessDialogOpen(true);
    } catch {
      setSubmitError("Network error. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form
      className="space-y-4 rounded-xl border border-border/70 bg-background/55 p-4"
      onSubmit={onSubmit}
    >
      <p className="text-xs text-muted-foreground">
        Fields marked with <span className="text-destructive">*</span> are
        required.
      </p>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-2">
          <Label>
            Type <span className="text-destructive">*</span>
          </Label>
          <Select
            value={kind}
            onValueChange={(value) => {
              const nextKind = value as TransactionInput["kind"];
              form.setValue("kind", nextKind);
              form.setValue("category", kindCategoryMap[nextKind][0]);
            }}
          >
            <SelectTrigger className="w-full bg-background/75">
              <SelectValue>
                {kind === "INCOME" ? "Income" : "Expense"}
              </SelectValue>
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
          <Label>
            Category <span className="text-destructive">*</span>
          </Label>
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
          <Label htmlFor="date">
            Date <span className="text-destructive">*</span>
          </Label>
          <Input
            id="date"
            type="date"
            max={maxDate}
            className="bg-background/75 [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-90"
            {...form.register("date")}
            aria-invalid={Boolean(form.formState.errors.date)}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="time">
            Time (HH:mm) <span className="text-destructive">*</span>
          </Label>
          <Input
            id="time"
            type="time"
            className="bg-background/75 [&::-webkit-calendar-picker-indicator]:cursor-pointer dark:[&::-webkit-calendar-picker-indicator]:invert dark:[&::-webkit-calendar-picker-indicator]:opacity-90"
            {...form.register("time")}
            aria-invalid={Boolean(form.formState.errors.time)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="name">
          Name <span className="text-destructive">*</span>
        </Label>
        <Input
          id="name"
          className="bg-background/75"
          {...form.register("name")}
          aria-invalid={Boolean(form.formState.errors.name)}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          className="bg-background/75"
          {...form.register("description")}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="amount">
          Amount <span className="text-destructive">*</span>
        </Label>
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
      <div className="space-y-2">
        <Label>
          Payment method <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-2 gap-2">
          {(["CASH", "CARD"] as const).map((method) => (
            <button
              key={method}
              type="button"
              className={cn(
                "inline-flex cursor-pointer items-center justify-center gap-1.5 rounded-md border border-border bg-background/75 px-2 py-2 text-xs transition hover:bg-secondary/70",
                paymentMethod === method
                  ? "border-primary bg-primary/20 text-primary"
                  : "text-muted-foreground",
              )}
              onClick={() =>
                form.setValue(
                  "paymentMethod",
                  method as TransactionInput["paymentMethod"],
                  {
                    shouldValidate: true,
                  },
                )
              }
            >
              {method === "CASH" ? <Banknote className="h-3.5 w-3.5" /> : null}
              {method === "CARD" ? (
                <CreditCard className="h-3.5 w-3.5" />
              ) : null}
              <span>{method === "CASH" ? "Cash" : "Card"}</span>
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-3 rounded-xl border border-border/70 bg-background/45 p-3">
        <Label>Repeat</Label>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
          {recurrenceFrequencies.map((frequency) => (
            <button
              key={frequency}
              type="button"
              className={cn(
                "inline-flex min-h-11 cursor-pointer items-center justify-center gap-1.5 rounded-lg border border-border bg-background px-2 py-2 text-xs font-medium transition-colors hover:bg-secondary/70",
                recurrence === frequency
                  ? "border-primary bg-primary/15 text-primary shadow-sm"
                  : "text-foreground/85",
              )}
              onClick={() =>
                form.setValue(
                  "recurrence",
                  frequency as TransactionInput["recurrence"],
                  {
                    shouldValidate: true,
                  },
                )
              }
            >
              <span>{frequency === "NONE" ? "No" : recurrenceLabelMap[frequency]}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/45 px-3 py-2.5">
        <Label htmlFor="isInstallment" className="text-sm font-medium">
          Installment
        </Label>
        <Switch
          id="isInstallment"
          checked={isInstallment}
          onCheckedChange={(checked) => {
            form.setValue("isInstallment", checked, { shouldValidate: true });
            if (!checked) {
              form.setValue("installmentNoExpiry", false);
              form.setValue("installmentMonths", undefined);
              form.setValue("installmentInterestPercent", undefined);
            }
          }}
        />
      </div>

      {isInstallment ? (
        <div className="space-y-3 rounded-xl border border-border/70 bg-background/45 p-3">
          <div className="flex items-center justify-between rounded-lg border border-border/60 bg-background px-3 py-2.5">
            <Label
              htmlFor="installmentNoExpiry"
              className="text-sm font-medium"
            >
              No expiry
            </Label>
            <Switch
              id="installmentNoExpiry"
              checked={installmentNoExpiry}
              onCheckedChange={(checked) => {
                form.setValue("installmentNoExpiry", checked, {
                  shouldValidate: true,
                });
                if (checked) {
                  form.setValue("installmentMonths", undefined, {
                    shouldValidate: true,
                  });
                }
              }}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="installmentMonths">
                Months{" "}
                {!installmentNoExpiry ? (
                  <span className="text-destructive">*</span>
                ) : null}
              </Label>
              <Input
                id="installmentMonths"
                type="number"
                min={1}
                max={84}
                disabled={installmentNoExpiry}
                className="bg-background"
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
              <Label htmlFor="installmentInterestPercent">
                Interest (%) <span className="text-destructive">*</span>
              </Label>
              <Input
                id="installmentInterestPercent"
                type="number"
                min={0}
                step="0.01"
                className="bg-background"
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
          {installmentNoExpiry ? (
            <p className="rounded-lg border border-amber-500/40 bg-amber-500/10 px-3 py-2 text-sm text-amber-700 dark:text-amber-400">
              Fixed cost
            </p>
          ) : null}
        </div>
      ) : null}

      {submitError ? (
        <p className="text-sm text-destructive">{submitError}</p>
      ) : null}
      {isQueued ? (
        <p className="text-sm text-emerald-600">
          Saved offline and pending sync.
        </p>
      ) : null}

      {Object.values(form.formState.errors).length > 0 ? (
        <p className="text-sm text-destructive">
          Please check required fields and values.
        </p>
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
            onClick={() => setIsDeleteDialogOpen(true)}
          >
            {isDeleting ? "Deleting..." : "Delete"}
          </Button>
        ) : null}
      </div>

      {isDeleteDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-background p-4 shadow-lg">
            <p className="text-base font-semibold">Confirm deletion</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Are you sure you want to delete this transaction?
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsDeleteDialogOpen(false)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
              >
                {isDeleting ? "Deleting..." : "Confirm"}
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {isDeleteSuccessDialogOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-lg border border-border bg-background p-4 shadow-lg">
            <p className="text-base font-semibold">Transaction deleted</p>
            <p className="mt-2 text-sm text-muted-foreground">
              The transaction has been removed and the list will be refreshed.
            </p>
            <div className="mt-4 flex justify-end">
              <Button
                type="button"
                onClick={() => {
                  setIsDeleteSuccessDialogOpen(false);
                  onComplete();
                }}
              >
                OK
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </form>
  );
}

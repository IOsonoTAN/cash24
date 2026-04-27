"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Plus } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { TransactionForm } from "@/components/transaction/transaction-form";
import { TransactionRow } from "@/lib/transaction-types";
import { cn } from "@/lib/utils";
import { VariantProps } from "class-variance-authority";

type TransactionDrawerProps = {
  mode?: "create" | "update";
  transaction?: TransactionRow;
  triggerClassName?: string;
  triggerLabel?: string;
  triggerVariant?: VariantProps<typeof buttonVariants>["variant"];
  triggerSize?: VariantProps<typeof buttonVariants>["size"];
  hideIcon?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  hideTrigger?: boolean;
};

export function TransactionDrawer({
  mode = "create",
  transaction,
  triggerClassName,
  triggerLabel,
  triggerVariant,
  triggerSize,
  hideIcon = false,
  open,
  onOpenChange,
  hideTrigger = false,
}: TransactionDrawerProps) {
  const [openState, setOpenState] = useState(false);
  const router = useRouter();
  const isCreate = mode === "create";
  const title = isCreate ? "Create expense or income" : "Edit transaction";
  const defaultTriggerClass = isCreate ? "w-full sm:w-auto" : "h-8";
  const resolvedTriggerClass = triggerClassName ?? defaultTriggerClass;
  const resolvedLabel = triggerLabel ?? (isCreate ? "Add transaction" : "Edit");
  const showIcon = !hideIcon;
  const iconClassName = resolvedLabel ? "mr-1 h-4 w-4" : "h-5 w-5";
  const isControlled = open !== undefined && onOpenChange !== undefined;
  const sheetOpen = isControlled ? open : openState;
  const setSheetOpen = isControlled ? onOpenChange : setOpenState;

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      {!hideTrigger ? (
        <SheetTrigger
          render={
            <Button
              className={cn(resolvedTriggerClass)}
              variant={triggerVariant ?? (isCreate ? "default" : "outline")}
              size={triggerSize}
            />
          }
        >
          {showIcon ? (
            isCreate ? <Plus className={iconClassName} /> : <Pencil className={iconClassName} />
          ) : null}
          {resolvedLabel}
        </SheetTrigger>
      ) : null}
      <SheetContent className="w-full border-white/50 bg-white/90 p-6 text-foreground shadow-2xl backdrop-blur-2xl dark:border-white/20 dark:bg-slate-950/90 sm:max-w-md">
        <SheetHeader>
          <SheetTitle className="text-2xl font-semibold">{title}</SheetTitle>
        </SheetHeader>
        <div className="mt-4">
          <TransactionForm
            mode={mode}
            transaction={transaction}
            onComplete={() => {
              setSheetOpen(false);
              router.refresh();
            }}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

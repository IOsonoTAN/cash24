import { describe, expect, it } from "vitest";
import { parseAmount, transactionInputSchema } from "./transaction";

const validInput = {
  kind: "EXPENSE" as const,
  category: "EXPENSE_FOOD" as const,
  date: "2026-04-27",
  time: "20:30",
  name: "Dinner",
  description: "Noodles",
  amount: "1,200.50",
  isInstallment: false,
};

describe("transaction validation", () => {
  it("accepts valid transaction payload", () => {
    const parsed = transactionInputSchema.safeParse(validInput);
    expect(parsed.success).toBe(true);
  });

  it("rejects future date/time", () => {
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
    const date = tomorrow.toISOString().slice(0, 10);
    const parsed = transactionInputSchema.safeParse({
      ...validInput,
      date,
      time: "23:59",
    });
    expect(parsed.success).toBe(false);
  });

  it("requires installment fields when installment is enabled", () => {
    const parsed = transactionInputSchema.safeParse({
      ...validInput,
      isInstallment: true,
    });
    expect(parsed.success).toBe(false);
  });

  it("parses amount string with comma format", () => {
    expect(parseAmount("12,345.67")).toBe(12345.67);
  });

  it("rejects category that does not match selected kind", () => {
    const parsed = transactionInputSchema.safeParse({
      ...validInput,
      kind: "INCOME",
      category: "EXPENSE_FOOD",
    });
    expect(parsed.success).toBe(false);
  });
});

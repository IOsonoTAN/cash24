import { describe, expect, it } from "vitest";
import { mapInstallmentsForMonth } from "./reporting";

describe("reporting", () => {
  it("maps installment rows for selected month", () => {
    const rows = mapInstallmentsForMonth(
      [
        {
          id: "txn1",
          userId: "user1",
          kind: "EXPENSE",
          category: "EXPENSE_OTHER",
          occurredAt: new Date("2026-01-10T10:00:00"),
          name: "PS5",
          description: null,
          amount: 10000,
          paymentMethod: "CASH",
          recurrence: "NONE",
          isInstallment: true,
          installmentNoExpiry: false,
          installmentMonths: 10,
          installmentInterestPercent: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      new Date("2026-02-01T00:00:00"),
    );

    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.currentMonth).toBe(2);
    expect(row.dueAmount).toBe(1000);
    expect(row.progressLabel).toBe("2/10");
    expect(row.finishMonth?.getFullYear()).toBe(2026);
    expect(row.finishMonth?.getMonth()).toBe(9);
  });

  it("maps no-expiry installment rows for selected month", () => {
    const rows = mapInstallmentsForMonth(
      [
        {
          id: "txn2",
          userId: "user1",
          kind: "EXPENSE",
          category: "EXPENSE_OTHER",
          occurredAt: new Date("2026-01-10T10:00:00"),
          name: "Rent",
          description: null,
          amount: 5000,
          paymentMethod: "CASH",
          recurrence: "NONE",
          isInstallment: true,
          installmentNoExpiry: true,
          installmentMonths: null,
          installmentInterestPercent: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      new Date("2026-03-01T00:00:00"),
    );

    expect(rows).toHaveLength(1);
    const row = rows[0]!;
    expect(row.currentMonth).toBe(3);
    expect(row.progressLabel).toBe("3/∞");
    expect(row.finishMonth).toBeNull();
  });
});

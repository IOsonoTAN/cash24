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
    expect(rows[0]?.currentMonth).toBe(2);
    expect(rows[0]?.dueAmount).toBe(1000);
    expect(rows[0]?.progressLabel).toBe("2/10");
    expect(rows[0]?.finishMonth.getFullYear()).toBe(2026);
    expect(rows[0]?.finishMonth.getMonth()).toBe(9);
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
    expect(rows[0]?.currentMonth).toBe(3);
    expect(rows[0]?.progressLabel).toBe("3/∞");
    expect(rows[0]?.finishMonth).toBeNull();
  });
});

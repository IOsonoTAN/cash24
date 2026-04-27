import { describe, expect, it } from "vitest";
import {
  calculateInstallmentFinishMonth,
  calculateCurrentInstallmentMonth,
  calculateMonthlyPayment,
  projectInstallmentForMonth,
} from "./installment";

describe("installment", () => {
  it("calculates monthly payment with interest", () => {
    const result = calculateMonthlyPayment(10000, 10, 5);
    expect(result).toBe(1050);
  });

  it("returns current installment month by selected month", () => {
    const occurredAt = new Date("2026-01-15T10:00:00");
    const targetMonth = new Date("2026-03-01T00:00:00");
    expect(calculateCurrentInstallmentMonth(occurredAt, targetMonth, 10)).toBe(3);
  });

  it("returns null when selected month is outside installment range", () => {
    const result = projectInstallmentForMonth({
      amount: 3000,
      months: 3,
      interestPercent: 0,
      occurredAt: new Date("2026-01-01T00:00:00"),
      targetMonth: new Date("2026-07-01T00:00:00"),
    });
    expect(result).toBeNull();
  });

  it("returns finish month from installment duration", () => {
    const finish = calculateInstallmentFinishMonth(new Date("2026-01-10T10:00:00"), 10);
    expect(finish.getFullYear()).toBe(2026);
    expect(finish.getMonth()).toBe(9);
  });

  it("projects no-expiry installment for future month", () => {
    const result = projectInstallmentForMonth({
      amount: 1000,
      noExpiry: true,
      interestPercent: 10,
      occurredAt: new Date("2026-01-01T00:00:00"),
      targetMonth: new Date("2026-07-01T00:00:00"),
    });
    expect(result).not.toBeNull();
    expect(result?.currentMonth).toBe(7);
    expect(result?.dueAmount).toBe(1100);
  });
});

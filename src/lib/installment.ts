export type InstallmentProjectionInput = {
  amount: number;
  months?: number | null;
  noExpiry?: boolean;
  interestPercent: number;
  occurredAt: Date;
  targetMonth: Date;
};

export function calculateMonthlyPayment(amount: number, months: number, interestPercent: number) {
  const total = amount + amount * (interestPercent / 100);
  return total / months;
}

export function calculateCurrentInstallmentMonth(
  occurredAt: Date,
  targetMonth: Date,
  months: number,
) {
  const startedMonth = new Date(occurredAt.getFullYear(), occurredAt.getMonth(), 1);
  const reportMonth = new Date(targetMonth.getFullYear(), targetMonth.getMonth(), 1);
  const monthOffset =
    (reportMonth.getFullYear() - startedMonth.getFullYear()) * 12 +
    (reportMonth.getMonth() - startedMonth.getMonth());
  const current = monthOffset + 1;
  if (current < 1 || current > months) {
    return null;
  }
  return current;
}

export function projectInstallmentForMonth(input: InstallmentProjectionInput) {
  if (input.noExpiry) {
    const startedMonth = new Date(input.occurredAt.getFullYear(), input.occurredAt.getMonth(), 1);
    const reportMonth = new Date(input.targetMonth.getFullYear(), input.targetMonth.getMonth(), 1);
    if (reportMonth < startedMonth) {
      return null;
    }
    const monthOffset =
      (reportMonth.getFullYear() - startedMonth.getFullYear()) * 12 +
      (reportMonth.getMonth() - startedMonth.getMonth());
    const currentMonth = monthOffset + 1;
    return {
      dueAmount: input.amount + input.amount * (input.interestPercent / 100),
      currentMonth,
    };
  }
  if (!input.months) {
    return null;
  }
  const currentMonth = calculateCurrentInstallmentMonth(
    input.occurredAt,
    input.targetMonth,
    input.months,
  );
  if (!currentMonth) {
    return null;
  }
  return {
    dueAmount: calculateMonthlyPayment(input.amount, input.months, input.interestPercent),
    currentMonth,
  };
}

export function calculateInstallmentFinishMonth(occurredAt: Date, months: number) {
  const finishMonth = new Date(occurredAt.getFullYear(), occurredAt.getMonth() + months - 1, 1);
  return finishMonth;
}

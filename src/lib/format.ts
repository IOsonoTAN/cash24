import { format } from "date-fns";

export function formatCurrency(value: number) {
  return new Intl.NumberFormat("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatDateTime(value: Date | string) {
  const date = value instanceof Date ? value : new Date(value);
  return format(date, "dd/MM/yyyy HH:mm");
}

export function sanitizeAmountInput(value: string) {
  const raw = value.replaceAll(",", "");
  if (!/^\d*\.?\d{0,2}$/.test(raw)) {
    return null;
  }
  const [integerPart, decimalPart] = raw.split(".");
  const formattedInteger = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
  if (decimalPart === undefined) {
    return formattedInteger;
  }
  return `${formattedInteger}.${decimalPart}`;
}

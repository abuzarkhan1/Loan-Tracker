import { Category, Contact, Loan, PaymentMethod, TransactionType } from "../api/types";

export const paymentMethodOptions: { label: string; value: PaymentMethod }[] = [
  { label: "Cash", value: "CASH" },
  { label: "Bank", value: "BANK" },
  { label: "JazzCash", value: "JAZZCASH" },
  { label: "EasyPaisa", value: "EASYPAISA" },
  { label: "Other", value: "OTHER" },
];

export const transactionTypeLabels: Record<TransactionType, string> = {
  INCOME: "Income",
  EXPENSE: "Expense",
  SALARY: "Salary",
  LOAN_RECOVERY: "Loan Recovery",
  LOAN_REPAYMENT: "Loan Repayment",
};

export const transactionTypeTone: Record<TransactionType, "inflow" | "outflow" | "neutral"> = {
  INCOME: "inflow",
  SALARY: "inflow",
  LOAN_RECOVERY: "inflow",
  EXPENSE: "outflow",
  LOAN_REPAYMENT: "outflow",
};

export const categoryName = (category?: string | Category) => {
  if (!category) return "Uncategorized";
  return typeof category === "string" ? "Category" : category.name;
};

export const contactName = (contact?: string | Contact) => {
  if (!contact) return undefined;
  return typeof contact === "string" ? "Linked contact" : contact.name;
};

export const loanLabel = (loan?: string | Loan) => {
  if (!loan) return undefined;
  if (typeof loan === "string") return "Linked loan";
  return loan.description || `${loan.type === "GIVEN" ? "Given" : "Taken"} loan`;
};

export const percentText = (value?: number) => `${Math.round(value || 0)}%`;

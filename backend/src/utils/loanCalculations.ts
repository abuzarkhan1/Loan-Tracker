import { LoanStatus, LoanType, PaymentType } from "../constants/enums";

export const getPaymentTypeForLoan = (loanType: LoanType) => {
  return loanType === LoanType.GIVEN ? PaymentType.RECEIVED : PaymentType.PAID;
};

export const isDueDatePassed = (dueDate?: Date | null) => {
  if (!dueDate) return false;

  const due = new Date(dueDate);
  due.setHours(0, 0, 0, 0);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  return due < today;
};

export const calculateLoanStatus = (
  amount: number,
  paidAmount: number,
  dueDate?: Date | null,
) => {
  const remainingAmount = Math.max(amount - paidAmount, 0);

  if (remainingAmount <= 0) return LoanStatus.COMPLETED;
  if (isDueDatePassed(dueDate)) return LoanStatus.OVERDUE;
  if (paidAmount > 0) return LoanStatus.PARTIALLY_PAID;

  return LoanStatus.ACTIVE;
};

export const calculateRemainingAmount = (amount: number, paidAmount: number) => {
  return Math.max(amount - paidAmount, 0);
};

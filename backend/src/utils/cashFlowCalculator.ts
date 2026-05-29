import { Types } from "mongoose";
import { TransactionModel, TransactionType } from "../modules/transactions/transaction.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

export type CashFlowSummary = {
  salaryReceived: number;
  otherIncome: number;
  totalIncome: number;
  totalExpenses: number;
  loanRecovery: number;
  loanRepayments: number;
  totalInflows: number;
  totalOutflows: number;
  availableCash: number;
  netCashFlow: number;
};

export const emptyCashFlowSummary = (): CashFlowSummary => ({
  salaryReceived: 0,
  otherIncome: 0,
  totalIncome: 0,
  totalExpenses: 0,
  loanRecovery: 0,
  loanRepayments: 0,
  totalInflows: 0,
  totalOutflows: 0,
  availableCash: 0,
  netCashFlow: 0,
});

export const getCashFlowSummary = async (userId: string, start: Date, end: Date): Promise<CashFlowSummary> => {
  const rows = await TransactionModel.aggregate([
    { $match: { userId: toObjectId(userId), date: { $gte: start, $lte: end } } },
    { $group: { _id: "$type", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
  ]);
  const get = (type: TransactionType) => rows.find((row) => row._id === type)?.amount || 0;
  const salaryReceived = get("SALARY");
  const otherIncome = get("INCOME");
  const totalExpenses = get("EXPENSE");
  const loanRecovery = get("LOAN_RECOVERY");
  const loanRepayments = get("LOAN_REPAYMENT");
  const totalIncome = salaryReceived + otherIncome;
  const totalInflows = totalIncome + loanRecovery;
  const totalOutflows = totalExpenses + loanRepayments;

  return {
    salaryReceived,
    otherIncome,
    totalIncome,
    totalExpenses,
    loanRecovery,
    loanRepayments,
    totalInflows,
    totalOutflows,
    availableCash: totalInflows - totalOutflows,
    netCashFlow: totalInflows - totalOutflows,
  };
};

import { Types } from "mongoose";
import { LoanType } from "../../constants/enums";
import { buildForecastWarnings, confidenceForForecast, sumValues } from "../../utils/forecastCalculator";
import { dateRangeFromQuery } from "../../utils/recurrence";
import { BillOccurrenceModel } from "../bills/bill-occurrence.model";
import { financeService } from "../finance/finance.service";
import { InstallmentModel, InstallmentStatus } from "../installments/installment.model";
import { LoanModel } from "../loans/loan.model";
import { PromiseModel } from "../promises/promise.model";
import { RecurringOccurrenceModel } from "../recurringTransactions/recurring-occurrence.model";
import { SalaryEntryModel } from "../salary/salary-entry.model";
import { salaryService } from "../salary/salary.service";
import { SavingsGoalModel } from "../savingsGoals/savings-goal.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const sortTimeline = (items: Array<Record<string, unknown> & { date: Date }>) => items.sort((a, b) => a.date.getTime() - b.date.getTime());

export const forecastService = {
  async build(userId: string, query: { startDate?: Date; endDate?: Date } = {}) {
    const cycle = query.startDate && query.endDate
      ? { cycleStartDate: query.startDate, cycleEndDate: query.endDate }
      : await salaryService.getCurrentCycle(userId);
    const range = dateRangeFromQuery({ startDate: cycle.cycleStartDate, endDate: cycle.cycleEndDate });
    const user = toObjectId(userId);
    const [dashboard, expectedSalary, recurringIncome, bills, recurringExpenses, payableLoans, installments, promises, savingsGoals] = await Promise.all([
      financeService.dashboard(userId, { dateFrom: range.start, dateTo: range.end }),
      SalaryEntryModel.find({ userId: user, status: "EXPECTED", salaryDate: { $gte: range.start, $lte: range.end } }),
      RecurringOccurrenceModel.find({ userId: user, type: "INCOME", status: { $in: ["UPCOMING", "DUE_TODAY"] }, dueDate: { $gte: range.start, $lte: range.end } }),
      BillOccurrenceModel.find({ userId: user, status: { $in: ["UPCOMING", "DUE_TODAY", "OVERDUE"] }, dueDate: { $gte: range.start, $lte: range.end } }),
      RecurringOccurrenceModel.find({ userId: user, type: "EXPENSE", status: { $in: ["UPCOMING", "DUE_TODAY", "OVERDUE"] }, dueDate: { $gte: range.start, $lte: range.end } }),
      LoanModel.find({ userId: user, type: LoanType.TAKEN, remainingAmount: { $gt: 0 }, dueDate: { $gte: range.start, $lte: range.end } }),
      InstallmentModel.find({ userId: user, status: { $ne: InstallmentStatus.PAID }, dueDate: { $gte: range.start, $lte: range.end } }),
      PromiseModel.find({ userId: user, status: "PENDING", promiseDate: { $gte: range.start, $lte: range.end } }),
      SavingsGoalModel.find({ userId: user, status: "ACTIVE" }),
    ]);

    const expectedInflows = {
      expectedSalary: expectedSalary.reduce((sum, entry) => sum + entry.amount, 0),
      expectedIncome: recurringIncome.reduce((sum, item) => sum + item.amount, 0),
      expectedLoanRecoveries: promises.reduce((sum, item) => sum + item.promisedAmount, 0),
    };
    const expectedOutflows = {
      upcomingBills: bills.reduce((sum, item) => sum + item.amount, 0),
      recurringExpenses: recurringExpenses.reduce((sum, item) => sum + item.amount, 0),
      loanRepayments: payableLoans.reduce((sum, loan) => sum + loan.remainingAmount, 0),
      installments: installments.reduce((sum, item) => sum + item.remainingAmount, 0),
      savingsTarget: savingsGoals.reduce((sum, goal) => sum + (goal.monthlyTarget || 0), 0),
    };

    const currentAvailableCash = dashboard.availableCash || 0;
    const projectedCash = currentAvailableCash + sumValues(expectedInflows) - sumValues(expectedOutflows);
    const warnings = buildForecastWarnings({ currentAvailableCash, expectedInflows, expectedOutflows, projectedCash });
    const timeline = sortTimeline([
      ...expectedSalary.map((entry) => ({ id: entry._id.toString(), type: "EXPECTED_SALARY", title: "Expected salary", date: entry.salaryDate, amount: entry.amount, direction: "INFLOW" })),
      ...recurringIncome.map((item) => ({ id: item._id.toString(), type: "RECURRING_INCOME", title: item.title, date: item.dueDate, amount: item.amount, direction: "INFLOW" })),
      ...promises.map((item) => ({ id: item._id.toString(), type: "EXPECTED_LOAN_RECOVERY", title: "Expected loan recovery", date: item.promiseDate, amount: item.promisedAmount, direction: "INFLOW" })),
      ...bills.map((item) => ({ id: item._id.toString(), type: "BILL", title: item.title, date: item.dueDate, amount: item.amount, direction: "OUTFLOW" })),
      ...recurringExpenses.map((item) => ({ id: item._id.toString(), type: "RECURRING_EXPENSE", title: item.title, date: item.dueDate, amount: item.amount, direction: "OUTFLOW" })),
      ...payableLoans.map((loan) => ({ id: loan._id.toString(), type: "LOAN_REPAYMENT", title: "Loan repayment", date: loan.dueDate!, amount: loan.remainingAmount, direction: "OUTFLOW" })),
      ...installments.map((item) => ({ id: item._id.toString(), type: "INSTALLMENT", title: `Installment #${item.installmentNumber}`, date: item.dueDate, amount: item.remainingAmount, direction: "OUTFLOW" })),
    ]);

    return {
      periodStart: range.start,
      periodEnd: range.end,
      currentAvailableCash,
      expectedInflows,
      expectedOutflows,
      projectedCash,
      projectedNetCashFlow: sumValues(expectedInflows) - sumValues(expectedOutflows),
      confidenceLevel: confidenceForForecast(warnings, expectedInflows.expectedSalary > 0, timeline.length > 0),
      warnings,
      assumptions: [
        "Loan recoveries are counted only when a promise to pay exists in this period.",
        "Bills and recurring transactions are projected from upcoming occurrences.",
        "This is spending guidance based on user-entered records, not financial advice.",
      ],
      timeline,
    };
  },
};

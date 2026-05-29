import { Types } from "mongoose";
import { LoanStatus } from "../../constants/enums";
import { calendarSeverity, FinanceCalendarEvent } from "../../utils/calendarEventBuilder";
import { dateRangeFromQuery, endOfDay, startOfDay } from "../../utils/recurrence";
import { BillOccurrenceModel } from "../bills/bill-occurrence.model";
import { InstallmentModel, InstallmentStatus } from "../installments/installment.model";
import { LoanModel } from "../loans/loan.model";
import { PromiseModel } from "../promises/promise.model";
import { RecurringOccurrenceModel } from "../recurringTransactions/recurring-occurrence.model";
import { NotificationLogModel } from "../reminders/notification-log.model";
import { SalaryEntryModel } from "../salary/salary-entry.model";
import { SavingsGoalModel } from "../savingsGoals/savings-goal.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const monthRange = (month?: number, year?: number) => {
  const now = new Date();
  const m = month || now.getMonth() + 1;
  const y = year || now.getFullYear();
  return { start: new Date(y, m - 1, 1), end: new Date(y, m, 0, 23, 59, 59, 999) };
};

const sum = (events: FinanceCalendarEvent[], predicate: (event: FinanceCalendarEvent) => boolean) =>
  events.filter(predicate).reduce((total, event) => total + (event.amount || 0), 0);

export const calendarService = {
  async events(userId: string, query: { startDate?: Date; endDate?: Date }) {
    const range = dateRangeFromQuery(query);
    const user = toObjectId(userId);
    const [salaryEntries, bills, recurring, loans, promises, installments, savingsGoals, reminders] = await Promise.all([
      SalaryEntryModel.find({ userId: user, salaryDate: { $gte: range.start, $lte: range.end } }),
      BillOccurrenceModel.find({ userId: user, dueDate: { $gte: range.start, $lte: range.end } }),
      RecurringOccurrenceModel.find({ userId: user, dueDate: { $gte: range.start, $lte: range.end } }),
      LoanModel.find({ userId: user, dueDate: { $gte: range.start, $lte: range.end }, remainingAmount: { $gt: 0 }, status: { $ne: LoanStatus.COMPLETED } }),
      PromiseModel.find({ userId: user, promiseDate: { $gte: range.start, $lte: range.end }, status: "PENDING" }),
      InstallmentModel.find({ userId: user, dueDate: { $gte: range.start, $lte: range.end }, status: { $ne: InstallmentStatus.PAID } }),
      SavingsGoalModel.find({ userId: user, deadline: { $gte: range.start, $lte: range.end }, status: "ACTIVE" }),
      NotificationLogModel.find({ userId: user, scheduledFor: { $gte: range.start, $lte: range.end } }),
    ]);

    const events: FinanceCalendarEvent[] = [
      ...salaryEntries.map((entry) => ({
        id: entry._id.toString(),
        type: "SALARY_EXPECTED",
        title: entry.status === "RECEIVED" ? "Salary received" : "Salary expected",
        amount: entry.amount,
        date: entry.salaryDate,
        status: entry.status,
        severity: calendarSeverity(entry.status),
        relatedEntityType: "SALARY_ENTRY",
        relatedEntityId: entry._id.toString(),
      })),
      ...bills.map((bill) => ({
        id: bill._id.toString(),
        type: "BILL_DUE",
        title: bill.title,
        amount: bill.amount,
        date: bill.dueDate,
        status: bill.status,
        severity: calendarSeverity(bill.status),
        relatedEntityType: "BILL_OCCURRENCE",
        relatedEntityId: bill._id.toString(),
      })),
      ...recurring.map((item) => ({
        id: item._id.toString(),
        type: item.type === "INCOME" ? "RECURRING_INCOME" : "RECURRING_EXPENSE",
        title: item.title,
        amount: item.amount,
        date: item.dueDate,
        status: item.status,
        severity: calendarSeverity(item.status),
        relatedEntityType: "RECURRING_OCCURRENCE",
        relatedEntityId: item._id.toString(),
      })),
      ...loans.map((loan) => ({
        id: loan._id.toString(),
        type: "LOAN_DUE",
        title: loan.type === "GIVEN" ? "Loan receivable due" : "Loan payable due",
        amount: loan.remainingAmount,
        date: loan.dueDate!,
        status: loan.status,
        severity: calendarSeverity(loan.status === LoanStatus.OVERDUE ? "OVERDUE" : undefined),
        relatedEntityType: "LOAN",
        relatedEntityId: loan._id.toString(),
      })),
      ...promises.map((promise) => ({
        id: promise._id.toString(),
        type: "PROMISE_DUE",
        title: "Promise to pay",
        amount: promise.promisedAmount,
        date: promise.promiseDate,
        status: promise.status,
        severity: calendarSeverity(promise.status),
        relatedEntityType: "PROMISE",
        relatedEntityId: promise._id.toString(),
      })),
      ...installments.map((installment) => ({
        id: installment._id.toString(),
        type: "INSTALLMENT_DUE",
        title: `Installment #${installment.installmentNumber}`,
        amount: installment.remainingAmount,
        date: installment.dueDate,
        status: installment.status,
        severity: calendarSeverity(installment.status),
        relatedEntityType: "INSTALLMENT",
        relatedEntityId: installment._id.toString(),
      })),
      ...savingsGoals.map((goal) => ({
        id: goal._id.toString(),
        type: "SAVINGS_GOAL_DEADLINE",
        title: goal.name,
        amount: Math.max(goal.targetAmount - goal.currentAmount, 0),
        date: goal.deadline!,
        status: goal.status,
        severity: calendarSeverity(goal.status),
        relatedEntityType: "SAVINGS_GOAL",
        relatedEntityId: goal._id.toString(),
      })),
      ...reminders.map((reminder) => ({
        id: reminder._id.toString(),
        type: "REMINDER",
        title: reminder.title,
        date: reminder.scheduledFor,
        status: reminder.status,
        severity: calendarSeverity(reminder.status),
        relatedEntityType: "REMINDER",
        relatedEntityId: reminder._id.toString(),
      })),
    ];

    return events.sort((a, b) => a.date.getTime() - b.date.getTime());
  },

  async day(userId: string, date: Date) {
    const events = await this.events(userId, { startDate: startOfDay(date), endDate: endOfDay(date) });
    const inflow = sum(events, (event) => ["SALARY_EXPECTED", "RECURRING_INCOME"].includes(event.type));
    const outflow = sum(events, (event) => ["BILL_DUE", "RECURRING_EXPENSE", "INSTALLMENT_DUE"].includes(event.type));
    return { date, events, inflow, outflow, net: inflow - outflow };
  },

  async monthSummary(userId: string, query: { month?: number; year?: number }) {
    const range = monthRange(query.month, query.year);
    const events = await this.events(userId, { startDate: range.start, endDate: range.end });
    const expectedInflow = sum(events, (event) => ["SALARY_EXPECTED", "RECURRING_INCOME"].includes(event.type));
    const expectedOutflow = sum(events, (event) => ["BILL_DUE", "RECURRING_EXPENSE", "LOAN_DUE", "PROMISE_DUE", "INSTALLMENT_DUE"].includes(event.type));
    return {
      month: query.month || new Date().getMonth() + 1,
      year: query.year || new Date().getFullYear(),
      expectedInflow,
      expectedOutflow,
      netProjection: expectedInflow - expectedOutflow,
      importantEvents: events.filter((event) => event.severity === "DANGER" || event.severity === "WARNING").slice(0, 6),
    };
  },
};

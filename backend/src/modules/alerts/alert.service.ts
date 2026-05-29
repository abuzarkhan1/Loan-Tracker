import { Types } from "mongoose";
import { buildPaginationMeta } from "../../utils/pagination";
import { ApiError } from "../../utils/apiError";
import { dateRangeFromQuery, startOfDay } from "../../utils/recurrence";
import { BillOccurrenceModel } from "../bills/bill-occurrence.model";
import { budgetService } from "../budgets/budget.service";
import { forecastService } from "../forecast/forecast.service";
import { RecurringOccurrenceModel } from "../recurringTransactions/recurring-occurrence.model";
import { SavingsGoalModel } from "../savingsGoals/savings-goal.model";
import { AlertModel, AlertSeverity, AlertType } from "./alert.model";

const toObjectId = (id: string | Types.ObjectId) => typeof id === "string" ? new Types.ObjectId(id) : id;

const upsertAlert = async (userId: string, payload: {
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  relatedEntityType?: string;
  relatedEntityId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
}) => AlertModel.findOneAndUpdate(
  {
    userId: toObjectId(userId),
    type: payload.type,
    relatedEntityId: payload.relatedEntityId,
    status: "ACTIVE",
  },
  { $set: { ...payload, userId: toObjectId(userId), status: "ACTIVE" } },
  { upsert: true, new: true, setDefaultsOnInsert: true },
);

export const alertService = {
  async get(userId: string, id: string) {
    const alert = await AlertModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!alert) throw new ApiError(404, "Alert not found");
    return alert;
  },

  async list(userId: string, filters: { status?: string; type?: string; page: number; limit: number }) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.status) query.status = filters.status;
    if (filters.type) query.type = filters.type;
    const limit = Math.min(filters.limit, 100);
    const [alerts, total] = await Promise.all([
      AlertModel.find(query).sort({ createdAt: -1 }).skip((filters.page - 1) * limit).limit(limit),
      AlertModel.countDocuments(query),
    ]);
    return { alerts, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async active(userId: string) {
    await this.evaluate(userId);
    return AlertModel.find({ userId: toObjectId(userId), status: "ACTIVE" }).sort({ severity: 1, createdAt: -1 }).limit(20);
  },

  async updateStatus(userId: string, id: string, status: "DISMISSED" | "RESOLVED") {
    const alert = await AlertModel.findOneAndUpdate({ _id: id, userId: toObjectId(userId) }, { $set: { status } }, { new: true });
    if (!alert) return null;
    return alert;
  },

  async evaluate(userId: string) {
    const [budget, forecast] = await Promise.all([
      budgetService.current(userId),
      forecastService.build(userId),
    ]);
    const created = [];
    if (budget?.usedPercent >= 100) {
      created.push(await upsertAlert(userId, {
        type: "BUDGET_EXCEEDED",
        title: "Budget exceeded",
        message: `Your current cycle budget is ${budget.usedPercent}% used.`,
        severity: "DANGER",
        relatedEntityType: "BUDGET",
        relatedEntityId: budget._id,
      }));
    } else if (budget?.usedPercent >= 80) {
      created.push(await upsertAlert(userId, {
        type: "BUDGET_80_PERCENT_USED",
        title: "Budget almost used",
        message: `Your current cycle budget is ${budget.usedPercent}% used.`,
        severity: "WARNING",
        relatedEntityType: "BUDGET",
        relatedEntityId: budget._id,
      }));
    }
    if (forecast.projectedCash < 0 || forecast.confidenceLevel === "LOW") {
      created.push(await upsertAlert(userId, {
        type: "LOW_PROJECTED_CASH",
        title: "Projected cash looks low",
        message: forecast.warnings[0] || "Your projected cash may get tight this period.",
        severity: forecast.projectedCash < 0 ? "DANGER" : "WARNING",
        metadata: { projectedCash: forecast.projectedCash },
      }));
    }
    const salaryBase = Math.max(forecast.expectedInflows.expectedSalary, 1);
    const repaymentRatio = Math.round((forecast.expectedOutflows.loanRepayments / salaryBase) * 100);
    if (repaymentRatio >= 30) {
      created.push(await upsertAlert(userId, {
        type: "HIGH_LOAN_REPAYMENT_RATIO",
        title: "Loan repayment ratio is high",
        message: `Loan repayments are projected at ${repaymentRatio}% of expected salary.`,
        severity: "WARNING",
        metadata: { repaymentRatio },
      }));
    }
    const range = dateRangeFromQuery({ startDate: new Date(), endDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) });
    const [dueBills, overdueBills, dueRecurring, goals] = await Promise.all([
      BillOccurrenceModel.find({ userId: toObjectId(userId), status: { $in: ["UPCOMING", "DUE_TODAY"] }, dueDate: { $gte: range.start, $lte: range.end } }).limit(5),
      BillOccurrenceModel.find({ userId: toObjectId(userId), status: { $nin: ["PAID", "SKIPPED"] }, dueDate: { $lt: startOfDay(new Date()) } }).limit(5),
      RecurringOccurrenceModel.find({ userId: toObjectId(userId), status: { $in: ["UPCOMING", "DUE_TODAY"] }, dueDate: { $gte: range.start, $lte: range.end } }).limit(5),
      SavingsGoalModel.find({ userId: toObjectId(userId), status: "ACTIVE", deadline: { $lt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) } }).limit(5),
    ]);
    for (const bill of dueBills) {
      created.push(await upsertAlert(userId, { type: "BILL_DUE_SOON", title: "Bill due soon", message: `${bill.title} is due on ${startOfDay(bill.dueDate).toDateString()}.`, severity: "WARNING", relatedEntityType: "BILL_OCCURRENCE", relatedEntityId: bill._id }));
    }
    for (const bill of overdueBills) {
      created.push(await upsertAlert(userId, { type: "BILL_OVERDUE", title: "Bill overdue", message: `${bill.title} is overdue.`, severity: "DANGER", relatedEntityType: "BILL_OCCURRENCE", relatedEntityId: bill._id }));
    }
    for (const item of dueRecurring) {
      created.push(await upsertAlert(userId, { type: "RECURRING_TRANSACTION_DUE", title: "Recurring item due", message: `${item.title} is due soon.`, severity: "INFO", relatedEntityType: "RECURRING_OCCURRENCE", relatedEntityId: item._id }));
    }
    for (const goal of goals) {
      const required = goal.targetAmount - goal.currentAmount;
      if (required > (goal.monthlyTarget || 0)) {
        created.push(await upsertAlert(userId, { type: "SAVINGS_GOAL_BEHIND", title: "Savings goal needs attention", message: `${goal.name} may need extra progress before its deadline.`, severity: "WARNING", relatedEntityType: "SAVINGS_GOAL", relatedEntityId: goal._id }));
      }
    }
    return created.filter(Boolean);
  },
};

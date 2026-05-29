import { Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";
import { getCashFlowSummary } from "../../utils/cashFlowCalculator";
import { buildFinanceInsights } from "../../utils/financeInsights";
import { CategoryModel } from "../categories/category.model";
import { salaryService } from "../salary/salary.service";
import { BudgetModel } from "../budgets/budget.model";
import { budgetService } from "../budgets/budget.service";
import { SavingsGoalModel } from "../savingsGoals/savings-goal.model";
import { TransactionModel, TransactionType } from "../transactions/transaction.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const monthRange = (month?: number, year?: number) => {
  const now = new Date();
  const m = month || now.getMonth() + 1;
  const y = year || now.getFullYear();
  return {
    start: new Date(y, m - 1, 1),
    end: new Date(y, m, 0, 23, 59, 59, 999),
  };
};

const resolveRange = async (userId: string, query: { date?: Date; dateFrom?: Date; dateTo?: Date; month?: number; year?: number } = {}) => {
  if (query.dateFrom || query.dateTo) {
    const range = monthRange(query.month, query.year);
    return {
      start: query.dateFrom || range.start,
      end: query.dateTo || range.end,
    };
  }
  if (query.month || query.year) return monthRange(query.month, query.year);
  const cycle = await salaryService.getCurrentCycle(userId, query.date || new Date());
  return { start: cycle.cycleStartDate, end: cycle.cycleEndDate };
};

const topExpenseCategory = async (userId: string, start: Date, end: Date) => {
  const rows = await TransactionModel.aggregate([
    { $match: { userId: toObjectId(userId), type: "EXPENSE", date: { $gte: start, $lte: end }, categoryId: { $ne: null } } },
    { $group: { _id: "$categoryId", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
    { $sort: { amount: -1 } },
    { $limit: 1 },
  ]);
  if (!rows[0]) return null;
  const category = await CategoryModel.findById(rows[0]._id).select("name icon color");
  return { categoryId: rows[0]._id.toString(), name: category?.name || "Other", amount: rows[0].amount, count: rows[0].count };
};

export const financeService = {
  async dashboard(userId: string, query: { date?: Date; dateFrom?: Date; dateTo?: Date; month?: number; year?: number } = {}) {
    const range = await resolveRange(userId, query);
    const [cashFlow, salarySummary, topCategory, budget, savingsGoals] = await Promise.all([
      getCashFlowSummary(userId, range.start, range.end),
      salaryService.getCycleSummary(userId, query.date || new Date()),
      topExpenseCategory(userId, range.start, range.end),
      BudgetModel.findOne({ userId: toObjectId(userId), cycleStartDate: range.start, cycleEndDate: range.end }),
      SavingsGoalModel.find({ userId: toObjectId(userId), status: "ACTIVE" }),
    ]);
    const savingsTarget = savingsGoals.reduce((sum, goal) => sum + (goal.monthlyTarget || 0), 0);
    const budgetUsedPercent = budget?.totalBudget ? Math.round((cashFlow.totalExpenses / budget.totalBudget) * 100) : salarySummary.budgetUsedPercent;
    const dashboard = {
      ...cashFlow,
      expectedSalary: salarySummary.expectedSalary,
      availableCash: cashFlow.availableCash,
      topExpenseCategory: topCategory,
      budgetUsedPercent,
      savingsEstimate: Math.max(cashFlow.availableCash, 0),
      savingsTarget,
      salaryCycle: {
        cycleStartDate: range.start,
        cycleEndDate: range.end,
      },
      charts: {
        cashFlow: await this.cashFlow(userId, query),
        categoryBreakdown: await this.categoryBreakdown(userId, query),
        paymentMethodBreakdown: await this.paymentMethodBreakdown(userId, query),
      },
    };
    return dashboard;
  },

  async cashFlow(userId: string, query: { date?: Date; dateFrom?: Date; dateTo?: Date; month?: number; year?: number } = {}) {
    const range = await resolveRange(userId, query);
    const rows = await TransactionModel.aggregate([
      { $match: { userId: toObjectId(userId), date: { $gte: range.start, $lte: range.end } } },
      {
        $group: {
          _id: { type: "$type", day: { $dateToString: { format: "%Y-%m-%d", date: "$date" } } },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.day": 1 } },
    ]);
    return rows.map((row) => ({ date: row._id.day, type: row._id.type, amount: row.amount }));
  },

  async categoryBreakdown(userId: string, query: { date?: Date; dateFrom?: Date; dateTo?: Date; month?: number; year?: number } = {}) {
    const range = await resolveRange(userId, query);
    const rows = await TransactionModel.aggregate([
      { $match: { userId: toObjectId(userId), type: "EXPENSE", date: { $gte: range.start, $lte: range.end }, categoryId: { $ne: null } } },
      { $group: { _id: "$categoryId", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      { $sort: { amount: -1 } },
      { $lookup: { from: "categories", localField: "_id", foreignField: "_id", as: "category" } },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    ]);
    return rows.map((row) => ({
      categoryId: row._id?.toString(),
      name: row.category?.name || "Other",
      color: row.category?.color,
      icon: row.category?.icon,
      amount: row.amount,
      count: row.count,
    }));
  },

  async paymentMethodBreakdown(userId: string, query: { date?: Date; dateFrom?: Date; dateTo?: Date; month?: number; year?: number; paymentMethod?: PaymentMethod } = {}) {
    const range = await resolveRange(userId, query);
    const match: Record<string, unknown> = { userId: toObjectId(userId), date: { $gte: range.start, $lte: range.end } };
    if (query.paymentMethod) match.paymentMethod = query.paymentMethod;
    const rows = await TransactionModel.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$paymentMethod",
          inflow: { $sum: { $cond: [{ $in: ["$type", ["INCOME", "SALARY", "LOAN_RECOVERY"]] }, "$amount", 0] } },
          outflow: { $sum: { $cond: [{ $in: ["$type", ["EXPENSE", "LOAN_REPAYMENT"]] }, "$amount", 0] } },
          transactionCount: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const methods = Object.values(PaymentMethod);
    return methods.map((method) => {
      const row = rows.find((item) => item._id === method);
      const inflow = row?.inflow || 0;
      const outflow = row?.outflow || 0;
      return { paymentMethod: method, inflow, outflow, net: inflow - outflow, transactionCount: row?.transactionCount || 0 };
    });
  },

  async monthlyReport(userId: string, query: { month?: number; year?: number } = {}) {
    const range = monthRange(query.month, query.year);
    const summary = await getCashFlowSummary(userId, range.start, range.end);
    return { month: query.month || new Date().getMonth() + 1, year: query.year || new Date().getFullYear(), ...summary };
  },

  async insights(userId: string, query: { date?: Date; dateFrom?: Date; dateTo?: Date; month?: number; year?: number } = {}) {
    const dashboard = await this.dashboard(userId, query);
    return buildFinanceInsights(dashboard);
  },

  async salaryVsExpenseReport(userId: string, query: { date?: Date; dateFrom?: Date; dateTo?: Date; month?: number; year?: number } = {}) {
    const dashboard = await this.dashboard(userId, query);
    return {
      salaryReceived: dashboard.salaryReceived,
      expectedSalary: dashboard.expectedSalary,
      totalExpenses: dashboard.totalExpenses,
      remainingCash: dashboard.availableCash,
      savingsEstimate: dashboard.savingsEstimate,
      expensePercentOfSalary: dashboard.expectedSalary ? Math.round((dashboard.totalExpenses / dashboard.expectedSalary) * 100) : 0,
    };
  },

  async loanImpactOnSalary(userId: string, query: { date?: Date; dateFrom?: Date; dateTo?: Date; month?: number; year?: number } = {}) {
    const dashboard = await this.dashboard(userId, query);
    const salaryBase = dashboard.salaryReceived || dashboard.expectedSalary || 0;
    return {
      loanRepayments: dashboard.loanRepayments,
      loanRecovery: dashboard.loanRecovery,
      netLoanCashFlow: dashboard.loanRecovery - dashboard.loanRepayments,
      repaymentPercentOfSalary: salaryBase ? Math.round((dashboard.loanRepayments / salaryBase) * 100) : 0,
      recoveryPercentOfSalary: salaryBase ? Math.round((dashboard.loanRecovery / salaryBase) * 100) : 0,
    };
  },

  async budgetUsage(userId: string, query: { date?: Date } = {}) {
    return budgetService.current(userId, query.date || new Date());
  },

  async savingsProgress(userId: string) {
    const goals = await SavingsGoalModel.find({ userId: toObjectId(userId) }).sort({ status: 1, createdAt: -1 });
    return goals.map((goal) => ({
      ...goal.toObject(),
      progressPercent: goal.targetAmount ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100) : 0,
    }));
  },

  async cashFlowTrend(userId: string) {
    const start = new Date();
    start.setMonth(start.getMonth() - 5);
    start.setDate(1);
    start.setHours(0, 0, 0, 0);
    const rows = await TransactionModel.aggregate([
      { $match: { userId: toObjectId(userId), date: { $gte: start } } },
      {
        $group: {
          _id: { month: { $dateToString: { format: "%Y-%m", date: "$date" } }, type: "$type" },
          amount: { $sum: "$amount" },
        },
      },
      { $sort: { "_id.month": 1 } },
    ]);
    const months = [...new Set(rows.map((row) => row._id.month))];
    return months.map((month) => {
      const get = (type: TransactionType) => rows.find((row) => row._id.month === month && row._id.type === type)?.amount || 0;
      const inflow = get("INCOME") + get("SALARY") + get("LOAN_RECOVERY");
      const outflow = get("EXPENSE") + get("LOAN_REPAYMENT");
      return { month, inflow, outflow, net: inflow - outflow };
    });
  },
};

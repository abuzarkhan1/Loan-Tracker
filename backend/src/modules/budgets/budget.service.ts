import { Types } from "mongoose";
import { ApiError } from "../../utils/apiError";
import { TransactionModel } from "../transactions/transaction.model";
import { salaryService } from "../salary/salary.service";
import { BudgetModel } from "./budget.model";

const toObjectId = (id: string | Types.ObjectId) => typeof id === "string" ? new Types.ObjectId(id) : id;

const withUsage = async (userId: string, budget: any) => {
  if (!budget) return null;
  const [totalExpenseRows, categoryRows] = await Promise.all([
    TransactionModel.aggregate([
      { $match: { userId: toObjectId(userId), type: "EXPENSE", date: { $gte: budget.cycleStartDate, $lte: budget.cycleEndDate } } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]),
    TransactionModel.aggregate([
      { $match: { userId: toObjectId(userId), type: "EXPENSE", date: { $gte: budget.cycleStartDate, $lte: budget.cycleEndDate }, categoryId: { $ne: null } } },
      { $group: { _id: "$categoryId", amount: { $sum: "$amount" } } },
    ]),
  ]);
  const usedAmount = totalExpenseRows[0]?.amount || 0;
  const object = budget.toObject();
  return {
      ...object,
      usedAmount,
      remainingBudget: Math.max((budget.totalBudget || 0) - usedAmount, 0),
      usedPercent: budget.totalBudget ? Math.round((usedAmount / budget.totalBudget) * 100) : 0,
    categoryBudgets: object.categoryBudgets.map((item: { categoryId: Types.ObjectId; amount: number }) => {
      const used = categoryRows.find((row) => row._id?.toString() === item.categoryId.toString())?.amount || 0;
      return {
        ...item,
        usedAmount: used,
        remainingAmount: Math.max(item.amount - used, 0),
        usedPercent: item.amount ? Math.round((used / item.amount) * 100) : 0,
      };
    }),
  };
};

export const budgetService = {
  async create(userId: string, payload: {
    cycleStartDate?: Date;
    cycleEndDate?: Date;
    month?: number;
    year?: number;
    totalBudget?: number;
    categoryBudgets: Array<{ categoryId: string; amount: number }>;
  }) {
    const cycle = payload.cycleStartDate && payload.cycleEndDate
      ? { cycleStartDate: payload.cycleStartDate, cycleEndDate: payload.cycleEndDate }
      : await salaryService.getCurrentCycle(userId);
    const budget = await BudgetModel.findOneAndUpdate(
      { userId: toObjectId(userId), cycleStartDate: cycle.cycleStartDate, cycleEndDate: cycle.cycleEndDate },
      {
        $set: {
          ...payload,
          userId: toObjectId(userId),
          cycleStartDate: cycle.cycleStartDate,
          cycleEndDate: cycle.cycleEndDate,
          categoryBudgets: (payload.categoryBudgets || []).map((item) => ({ ...item, categoryId: toObjectId(item.categoryId) })),
        },
      },
      { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true },
    );
    return withUsage(userId, budget);
  },

  async current(userId: string, date = new Date()) {
    const cycle = await salaryService.getCurrentCycle(userId, date);
    const budget = await BudgetModel.findOne({ userId: toObjectId(userId), cycleStartDate: cycle.cycleStartDate, cycleEndDate: cycle.cycleEndDate }).populate("categoryBudgets.categoryId", "name type icon color");
    return withUsage(userId, budget);
  },

  async list(userId: string, filters: { month?: number; year?: number; date?: Date }) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.month) query.month = filters.month;
    if (filters.year) query.year = filters.year;
    if (filters.date) {
      const cycle = await salaryService.getCurrentCycle(userId, filters.date);
      query.cycleStartDate = cycle.cycleStartDate;
      query.cycleEndDate = cycle.cycleEndDate;
    }
    const budgets = await BudgetModel.find(query).populate("categoryBudgets.categoryId", "name type icon color").sort({ cycleStartDate: -1 });
    return Promise.all(budgets.map((budget) => withUsage(userId, budget)));
  },

  async update(userId: string, id: string, payload: Record<string, unknown>) {
    const budget = await BudgetModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!budget) throw new ApiError(404, "Budget not found");
    budget.set({
      ...payload,
      categoryBudgets: Array.isArray(payload.categoryBudgets)
        ? payload.categoryBudgets.map((item) => ({ ...item, categoryId: toObjectId(item.categoryId) }))
        : budget.categoryBudgets,
    });
    await budget.save();
    return withUsage(userId, budget);
  },

  async delete(userId: string, id: string) {
    const budget = await BudgetModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!budget) throw new ApiError(404, "Budget not found");
    await budget.deleteOne();
    return { id };
  },
};

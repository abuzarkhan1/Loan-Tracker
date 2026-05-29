import { Types } from "mongoose";
import { ApiError } from "../../utils/apiError";
import { recommendBudget } from "../../utils/budgetRecommendations";
import { TransactionModel } from "../transactions/transaction.model";
import { salaryService } from "../salary/salary.service";
import { BudgetModel } from "./budget.model";
import { CategoryModel } from "../categories/category.model";

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

  async recommendations(userId: string) {
    const now = new Date();
    const cycle = await salaryService.getCurrentCycle(userId, now);
    const start = new Date(cycle.cycleStartDate);
    start.setMonth(start.getMonth() - 3);
    const [rows, categories, currentBudget] = await Promise.all([
      TransactionModel.aggregate([
        { $match: { userId: toObjectId(userId), type: "EXPENSE", date: { $gte: start, $lte: cycle.cycleEndDate }, categoryId: { $ne: null } } },
        { $group: { _id: "$categoryId", total: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { total: -1 } },
      ]),
      CategoryModel.find({ userId: toObjectId(userId), type: "EXPENSE", isActive: true }).select("name icon color"),
      this.current(userId, now),
    ]);
    const categoryRecommendations = categories.map((category) => {
      const row = rows.find((item) => item._id?.toString() === category._id.toString());
      const averageSpending = Math.round(((row?.total || 0) / 3) * 100) / 100;
      const currentCategoryBudget = currentBudget?.categoryBudgets?.find((item: any) => item.categoryId?._id?.toString?.() === category._id.toString() || item.categoryId?.toString?.() === category._id.toString());
      const recommendation = recommendBudget(averageSpending, currentCategoryBudget?.amount);
      return {
        categoryId: category._id.toString(),
        categoryName: category.name,
        icon: category.icon,
        color: category.color,
        averageSpending,
        currentBudget: currentCategoryBudget?.amount || 0,
        ...recommendation,
      };
    }).filter((item) => item.averageSpending > 0 || item.currentBudget > 0);
    const recommendedTotalBudget = categoryRecommendations.reduce((sum, item) => sum + item.recommendedBudget, 0);
    return {
      recommendedTotalBudget,
      categoryRecommendations,
      savingsSuggestion: "Keep at least one realistic savings target before accepting a higher spending budget.",
      warnings: currentBudget?.usedPercent >= 100 ? ["Current budget is already exceeded. Review high-spend categories first."] : [],
    };
  },

  async applyRecommendations(userId: string, categoryIds?: string[]) {
    const recommendations = await this.recommendations(userId);
    const selected = categoryIds?.length
      ? recommendations.categoryRecommendations.filter((item) => categoryIds.includes(item.categoryId))
      : recommendations.categoryRecommendations;
    return this.create(userId, {
      totalBudget: selected.reduce((sum, item) => sum + item.recommendedBudget, 0),
      categoryBudgets: selected.map((item) => ({ categoryId: item.categoryId, amount: item.recommendedBudget })),
    });
  },
};

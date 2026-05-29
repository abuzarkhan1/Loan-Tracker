import { Types } from "mongoose";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { SavingsGoalProgressModel } from "./savings-goal-progress.model";
import { SavingsGoalModel, SavingsGoalStatus } from "./savings-goal.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const updateCompletedStatus = (goal: { targetAmount: number; currentAmount: number; status: SavingsGoalStatus }) => {
  if (goal.currentAmount >= goal.targetAmount) goal.status = "COMPLETED";
  if (goal.currentAmount < goal.targetAmount && goal.status === "COMPLETED") goal.status = "ACTIVE";
};

export const savingsGoalService = {
  create(userId: string, payload: Record<string, unknown>) {
    return SavingsGoalModel.create({ ...payload, userId: toObjectId(userId) });
  },

  list(userId: string, filters: { status?: SavingsGoalStatus }) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.status) query.status = filters.status;
    return SavingsGoalModel.find(query).sort({ status: 1, createdAt: -1 });
  },

  async get(userId: string, id: string) {
    const goal = await SavingsGoalModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!goal) throw new ApiError(404, "Savings goal not found");
    return goal;
  },

  async update(userId: string, id: string, payload: Record<string, unknown>) {
    const goal = await this.get(userId, id);
    goal.set(payload);
    updateCompletedStatus(goal);
    await goal.save();
    return goal;
  },

  async delete(userId: string, id: string) {
    const goal = await this.get(userId, id);
    await SavingsGoalProgressModel.deleteMany({ userId: toObjectId(userId), goalId: goal._id });
    await goal.deleteOne();
    return { id };
  },

  async addProgress(userId: string, id: string, payload: { amount: number; date?: Date; note?: string }) {
    const goal = await this.get(userId, id);
    await SavingsGoalProgressModel.create({
      userId: toObjectId(userId),
      goalId: goal._id,
      amount: payload.amount,
      date: payload.date || new Date(),
      note: payload.note || undefined,
    });
    goal.currentAmount += payload.amount;
    updateCompletedStatus(goal);
    await goal.save();
    return goal;
  },

  async listProgress(userId: string, goalId: string, filters: { page: number; limit: number }) {
    await this.get(userId, goalId);
    const limit = Math.min(filters.limit, 100);
    const query = { userId: toObjectId(userId), goalId: toObjectId(goalId) };
    const [progress, total] = await Promise.all([
      SavingsGoalProgressModel.find(query).sort({ date: -1 }).skip((filters.page - 1) * limit).limit(limit),
      SavingsGoalProgressModel.countDocuments(query),
    ]);
    return { progress, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async sumProgressInRange(userId: string, start: Date, end: Date) {
    const rows = await SavingsGoalProgressModel.aggregate([
      { $match: { userId: toObjectId(userId), date: { $gte: start, $lte: end } } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);
    return rows[0]?.amount || 0;
  },
};

import { Types } from "mongoose";
import { ApiError } from "../../utils/apiError";
import { financeService } from "../finance/finance.service";
import { SavingsGoalModel } from "../savingsGoals/savings-goal.model";
import { auditLogService } from "../audit/audit-log.service";

const toObjectId = (id: string) => new Types.ObjectId(id);

const calculatePlanForGoal = (goal: any) => {
  const remainingAmount = Math.max(goal.targetAmount - goal.currentAmount, 0);
  const now = new Date();
  const deadline = goal.deadline ? new Date(goal.deadline) : undefined;
  const monthsRemaining = deadline ? Math.max(1, Math.ceil((deadline.getTime() - now.getTime()) / (30 * 24 * 60 * 60 * 1000))) : undefined;
  const requiredMonthlySaving = monthsRemaining ? Math.ceil(remainingAmount / monthsRemaining) : goal.monthlyTarget || remainingAmount;
  const onTrack = remainingAmount <= 0 || (goal.monthlyTarget || 0) >= requiredMonthlySaving;
  const behindAmount = onTrack ? 0 : requiredMonthlySaving - (goal.monthlyTarget || 0);
  return {
    goalId: goal._id.toString(),
    monthsRemaining,
    requiredMonthlySaving,
    currentProgress: goal.targetAmount ? Math.min(Math.round((goal.currentAmount / goal.targetAmount) * 100), 100) : 0,
    onTrack,
    behindAmount,
    recommendedAction: onTrack
      ? "Keep adding progress consistently."
      : `Increase monthly saving by about Rs. ${behindAmount.toLocaleString()} to stay on track.`,
  };
};

export const goalPlannerService = {
  async planner(userId: string) {
    const goals = await SavingsGoalModel.find({ userId: toObjectId(userId), status: { $in: ["ACTIVE", "PAUSED"] } }).sort({ priority: -1, deadline: 1 });
    return goals.map((goal) => ({ goal, plan: calculatePlanForGoal(goal) }));
  },

  async calculate(userId: string, id: string) {
    const goal = await SavingsGoalModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!goal) throw new ApiError(404, "Goal not found");
    return { goal, plan: calculatePlanForGoal(goal) };
  },

  async autoPlan(userId: string, id: string) {
    const goal = await SavingsGoalModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!goal) throw new ApiError(404, "Goal not found");
    const plan = calculatePlanForGoal(goal);
    const dashboard = await financeService.dashboard(userId);
    const realisticMonthlySavingBasedOnCashFlow = Math.max(Math.floor((dashboard.availableCash || 0) * 0.35), 0);
    const projectedCompletionMonths = realisticMonthlySavingBasedOnCashFlow > 0
      ? Math.ceil(Math.max(goal.targetAmount - goal.currentAmount, 0) / realisticMonthlySavingBasedOnCashFlow)
      : undefined;
    const projectedCompletionDate = projectedCompletionMonths
      ? new Date(new Date().setMonth(new Date().getMonth() + projectedCompletionMonths))
      : undefined;
    const isRealistic = realisticMonthlySavingBasedOnCashFlow >= plan.requiredMonthlySaving;
    return {
      targetAmount: goal.targetAmount,
      currentAmount: goal.currentAmount,
      remainingAmount: Math.max(goal.targetAmount - goal.currentAmount, 0),
      deadline: goal.deadline,
      monthsRemaining: plan.monthsRemaining,
      requiredMonthlySaving: plan.requiredMonthlySaving,
      realisticMonthlySavingBasedOnCashFlow,
      isOnTrack: plan.onTrack && isRealistic,
      projectedCompletionDate,
      suggestions: isRealistic
        ? ["Your current cash flow can support this goal plan."]
        : ["Extend the deadline or lower the monthly target.", "Review expenses before applying this plan."],
    };
  },

  async applyAutoPlan(userId: string, id: string) {
    const goal = await SavingsGoalModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!goal) throw new ApiError(404, "Goal not found");
    const plan = await this.autoPlan(userId, id);
    const canMeetDeadline = plan.realisticMonthlySavingBasedOnCashFlow >= plan.requiredMonthlySaving;
    const nextMonthlyTarget = canMeetDeadline
      ? plan.requiredMonthlySaving
      : Math.max(plan.realisticMonthlySavingBasedOnCashFlow, goal.monthlyTarget || 0);
    const oldValue = goal.toObject();
    goal.set({
      monthlyTarget: nextMonthlyTarget,
      ...(canMeetDeadline ? {} : plan.projectedCompletionDate ? { deadline: plan.projectedCompletionDate } : {}),
      autoContributionEnabled: true,
    });
    await goal.save();
    await auditLogService.record({
      userId,
      action: "GOAL_AUTO_PLAN_APPLIED",
      entityType: "SAVINGS_GOAL",
      entityId: goal._id.toString(),
      oldValue,
      newValue: goal.toObject(),
      metadata: { plan },
    });
    return { goal, plan: await this.autoPlan(userId, id) };
  },

  async setStatus(userId: string, id: string, status: "ACTIVE" | "PAUSED") {
    const goal = await SavingsGoalModel.findOneAndUpdate({ _id: id, userId: toObjectId(userId) }, { $set: { status } }, { new: true });
    if (!goal) throw new ApiError(404, "Goal not found");
    return goal;
  },
};

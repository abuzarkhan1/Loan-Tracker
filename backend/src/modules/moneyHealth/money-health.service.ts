import { Types } from "mongoose";
import { LoanStatus } from "../../constants/enums";
import { BillOccurrenceModel } from "../bills/bill-occurrence.model";
import { LoanModel } from "../loans/loan.model";
import { PromiseModel } from "../promises/promise.model";
import { SavingsGoalModel } from "../savingsGoals/savings-goal.model";
import { forecastService } from "../forecast/forecast.service";
import { budgetService } from "../budgets/budget.service";
import { detectDataQualityIssues } from "../../utils/dataQualityDetector";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const moneyHealthService = {
  async score(userId: string) {
    const user = toObjectId(userId);
    const [overdueLoans, brokenPromises, overdueBills, goals, forecast, budget, dataIssues] = await Promise.all([
      LoanModel.countDocuments({ userId: user, status: LoanStatus.OVERDUE, remainingAmount: { $gt: 0 } }),
      PromiseModel.countDocuments({ userId: user, status: "BROKEN" }),
      BillOccurrenceModel.countDocuments({ userId: user, status: "OVERDUE" }),
      SavingsGoalModel.find({ userId: user, status: "ACTIVE" }),
      forecastService.build(userId).catch(() => null),
      budgetService.current(userId, new Date()).catch(() => null),
      detectDataQualityIssues(userId),
    ]);
    const factors = [
      { factor: "Overdue Loans", impact: -Math.min(overdueLoans * 8, 24), message: overdueLoans ? `${overdueLoans} overdue loans need attention.` : "No overdue loans." },
      { factor: "Broken Promises", impact: -Math.min(brokenPromises * 5, 15), message: brokenPromises ? `${brokenPromises} broken promises found.` : "No broken promises." },
      { factor: "Overdue Bills", impact: -Math.min(overdueBills * 5, 15), message: overdueBills ? `${overdueBills} bills are overdue.` : "No overdue bills." },
      { factor: "Projected Cash", impact: forecast && forecast.projectedCash < 0 ? -18 : 4, message: forecast && forecast.projectedCash < 0 ? "Projected cash is negative." : "Projected cash is stable." },
      { factor: "Budget", impact: budget && budget.usedAmount > budget.totalBudget ? -12 : 4, message: budget && budget.usedAmount > budget.totalBudget ? "Budget is exceeded." : "Budget looks controlled." },
      { factor: "Savings Goals", impact: goals.some((goal) => goal.monthlyTarget && goal.currentAmount < goal.monthlyTarget) ? -5 : 4, message: goals.length ? "Savings goals are being tracked." : "No active savings goals yet." },
      { factor: "Data Quality", impact: -Math.min(dataIssues.length * 2, 14), message: dataIssues.length ? `${dataIssues.length} records can be cleaned up.` : "Records look clean." },
    ];
    const score = Math.max(0, Math.min(100, 82 + factors.reduce((total, item) => total + item.impact, 0)));
    const label = score >= 85 ? "EXCELLENT" : score >= 70 ? "GOOD" : score >= 45 ? "NEEDS_ATTENTION" : "CRITICAL";
    return {
      score,
      label,
      summary: label === "EXCELLENT" ? "Your money tracking is very organized." : label === "GOOD" ? "Your money tracking is mostly organized." : "Some money records need attention.",
      breakdown: factors,
      suggestions: dataIssues.slice(0, 5).map((issue) => ({ title: issue.title, actionRoute: issue.actionRoute, entityId: issue.entityId })),
      updatedAt: new Date(),
    };
  },
};

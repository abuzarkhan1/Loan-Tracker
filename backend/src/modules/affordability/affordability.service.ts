import { Types } from "mongoose";
import { calculateAffordability } from "../../utils/affordabilityCalculator";
import { sumValues } from "../../utils/forecastCalculator";
import { BudgetModel } from "../budgets/budget.model";
import { budgetService } from "../budgets/budget.service";
import { forecastService } from "../forecast/forecast.service";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const affordabilityService = {
  async check(userId: string, payload: { amount: number; categoryId?: string; plannedDate: Date; note?: string }) {
    const forecast = await forecastService.build(userId);
    let categoryBudgetRemaining: number | undefined;
    if (payload.categoryId) {
      const currentBudget = await budgetService.current(userId, payload.plannedDate);
      const budget = currentBudget?.categoryBudgets?.find((item: any) => item.categoryId?._id?.toString?.() === payload.categoryId || item.categoryId?.toString?.() === payload.categoryId);
      if (budget) categoryBudgetRemaining = budget.remainingAmount;
      if (!budget) {
        const rawBudget = await BudgetModel.findOne({ userId: toObjectId(userId), "categoryBudgets.categoryId": toObjectId(payload.categoryId) });
        const item = rawBudget?.categoryBudgets.find((entry) => entry.categoryId.toString() === payload.categoryId);
        if (item) categoryBudgetRemaining = item.amount;
      }
    }
    const result = calculateAffordability({
      amount: payload.amount,
      currentAvailableCash: forecast.currentAvailableCash,
      projectedCash: forecast.projectedCash,
      upcomingOutflows: sumValues(forecast.expectedOutflows),
      categoryBudgetRemaining,
    });
    return {
      amount: payload.amount,
      categoryId: payload.categoryId,
      plannedDate: payload.plannedDate,
      currentAvailableCash: forecast.currentAvailableCash,
      upcomingOutflows: forecast.expectedOutflows,
      savingsImpact: forecast.expectedOutflows.savingsTarget,
      budgetImpact: categoryBudgetRemaining !== undefined ? { categoryBudgetRemaining, exceedsBudget: payload.amount > categoryBudgetRemaining } : null,
      ...result,
    };
  },
};

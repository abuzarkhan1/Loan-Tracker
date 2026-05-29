export type ScenarioType = "PURCHASE" | "REDUCE_EXPENSE" | "EXTRA_LOAN_PAYMENT" | "SALARY_DELAY" | "EXTRA_SAVING" | "CUSTOM";

export const simulateScenario = ({
  type,
  amount,
  projectedCash,
  currentAvailableCash,
}: {
  type: ScenarioType;
  amount: number;
  projectedCash: number;
  currentAvailableCash: number;
}) => {
  const impactAmount = type === "REDUCE_EXPENSE" ? amount : -amount;
  const projectedCashAfter = projectedCash + impactAmount;
  const ratio = currentAvailableCash ? Math.abs(impactAmount) / currentAvailableCash : 1;
  const riskLevel = projectedCashAfter < 0 || ratio > 0.6 ? "HIGH" : projectedCashAfter < currentAvailableCash * 0.2 || ratio > 0.35 ? "MEDIUM" : "LOW";
  return {
    projectedCashBefore: projectedCash,
    projectedCashAfter,
    impactAmount,
    riskLevel,
    summary: riskLevel === "HIGH" ? "This scenario can put your cash flow under pressure." : riskLevel === "MEDIUM" ? "This scenario is possible, but keep an eye on upcoming outflows." : "This scenario looks manageable based on current records.",
    warnings: projectedCashAfter < 0 ? ["Projected cash becomes negative."] : ratio > 0.35 ? ["This uses a noticeable part of available cash."] : [],
    suggestions: riskLevel === "HIGH" ? ["Delay this action or reduce the amount.", "Review upcoming bills and repayments first."] : ["Keep tracking expenses after this change."],
    affectedBudgets: [],
    affectedGoals: [],
  };
};

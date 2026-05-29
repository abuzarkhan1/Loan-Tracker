export const calculateAffordability = (payload: {
  amount: number;
  currentAvailableCash: number;
  projectedCash: number;
  categoryBudgetRemaining?: number;
  upcomingOutflows: number;
}) => {
  const projectedCashAfterPurchase = payload.projectedCash - payload.amount;
  const safeSpendingLimit = Math.max(payload.projectedCash - Math.max(payload.upcomingOutflows * 0.15, 1000), 0);
  const reasons: string[] = [];
  const suggestions: string[] = [];

  let result: "SAFE" | "RISKY" | "NOT_RECOMMENDED" = "SAFE";
  if (projectedCashAfterPurchase < 0) {
    result = "NOT_RECOMMENDED";
    reasons.push("This purchase can make projected cash negative for the selected period.");
    suggestions.push("Wait until the next salary/income cycle or reduce the purchase amount.");
  } else if (payload.amount > safeSpendingLimit || projectedCashAfterPurchase < payload.currentAvailableCash * 0.15) {
    result = "RISKY";
    reasons.push("This purchase leaves a small buffer after upcoming bills and planned outflows.");
    suggestions.push("Keep a cash buffer for bills, repayments, and savings goals.");
  }

  if (payload.categoryBudgetRemaining !== undefined && payload.amount > payload.categoryBudgetRemaining) {
    result = result === "NOT_RECOMMENDED" ? result : "RISKY";
    reasons.push("This purchase exceeds the available budget for this category.");
    suggestions.push("Adjust the category budget or move this purchase to a later cycle.");
  }

  if (!reasons.length) reasons.push("Based on your current data, this purchase fits within projected cash.");
  return { result, safeSpendingLimit, projectedCashAfterPurchase, reasons, suggestions };
};

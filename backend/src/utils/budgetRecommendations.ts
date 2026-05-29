export const recommendBudget = (averageSpending: number, currentBudget?: number) => {
  const buffer = averageSpending <= 0 ? 0 : Math.max(500, averageSpending * 0.1);
  const recommendedBudget = Math.ceil((averageSpending + buffer) / 100) * 100;
  const confidence = averageSpending > 0 ? "MEDIUM" : "LOW";
  const reason = currentBudget
    ? averageSpending > currentBudget
      ? "Recent spending is higher than the current budget."
      : "Current budget is close to recent spending."
    : "Recommendation is based on recent spending history.";
  return { recommendedBudget, confidence, reason };
};

export type ForecastMoneyGroup = Record<string, number>;

export const sumValues = (group: ForecastMoneyGroup) => Object.values(group).reduce((sum, value) => sum + value, 0);

export const buildForecastWarnings = (payload: {
  currentAvailableCash: number;
  expectedInflows: ForecastMoneyGroup;
  expectedOutflows: ForecastMoneyGroup;
  projectedCash: number;
}) => {
  const warnings: string[] = [];
  const totalInflows = sumValues(payload.expectedInflows);
  const totalOutflows = sumValues(payload.expectedOutflows);
  if (payload.projectedCash < 0) warnings.push("Projected cash is expected to go below zero in this period.");
  if (payload.projectedCash > 0 && payload.projectedCash < payload.currentAvailableCash * 0.2) warnings.push("Projected cash may get tight near the end of this period.");
  if (totalOutflows > totalInflows + payload.currentAvailableCash) warnings.push("Upcoming outflows are higher than confirmed cash and expected inflows.");
  if ((payload.expectedOutflows.loanRepayments || 0) > totalInflows * 0.25) warnings.push("Loan repayments are a high share of expected inflows.");
  return warnings;
};

export const confidenceForForecast = (warnings: string[], hasExpectedSalary: boolean, hasUpcomingItems: boolean) => {
  if (warnings.length >= 2) return "LOW" as const;
  if (!hasExpectedSalary && !hasUpcomingItems) return "LOW" as const;
  if (warnings.length === 1) return "MEDIUM" as const;
  return "HIGH" as const;
};

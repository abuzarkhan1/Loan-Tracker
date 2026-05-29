export const percentageChange = (currentValue: number, previousValue: number) => {
  if (!previousValue && !currentValue) return 0;
  if (!previousValue) return 100;
  return Math.round(((currentValue - previousValue) / previousValue) * 100);
};

export const spendingSeverity = (changePercent: number) => {
  if (changePercent >= 40) return "WARNING" as const;
  if (changePercent <= -20) return "SUCCESS" as const;
  return "INFO" as const;
};

import { LoanStatus } from "../constants/enums";

export type TrustScoreInput = {
  totalLoans: number;
  completedLoans: number;
  activeLoans: number;
  overdueLoans: number;
  onTimePaymentRate: number;
  overdueFrequency: number;
};

export type TrustLabel = "EXCELLENT" | "GOOD" | "AVERAGE" | "RISKY" | "NEW";

export const getTrustLabel = (score: number, totalLoans: number): TrustLabel => {
  if (totalLoans === 0) return "NEW";
  if (score >= 85) return "EXCELLENT";
  if (score >= 70) return "GOOD";
  if (score >= 50) return "AVERAGE";
  return "RISKY";
};

export const calculateTrustScore = (input: TrustScoreInput) => {
  if (input.totalLoans === 0) {
    return { trustScore: 0, label: "NEW" as TrustLabel };
  }

  const completionScore = (input.completedLoans / input.totalLoans) * 35;
  const onTimeScore = input.onTimePaymentRate * 35;
  const activeScore = input.activeLoans > 0 ? 10 : 15;
  const overduePenalty = Math.min(input.overdueFrequency * 35 + input.overdueLoans * 10, 55);
  const trustScore = Math.max(0, Math.min(100, Math.round(50 + completionScore + onTimeScore + activeScore - overduePenalty)));

  return {
    trustScore,
    label: getTrustLabel(trustScore, input.totalLoans),
  };
};

export const getLoanTrustStatus = (status: LoanStatus, dueDate?: Date, paidAt?: Date) => {
  if (status === LoanStatus.COMPLETED && dueDate && paidAt) {
    return paidAt.getTime() <= dueDate.getTime() ? "ON_TIME" : "LATE";
  }
  if (status === LoanStatus.OVERDUE) return "OVERDUE";
  return "OPEN";
};

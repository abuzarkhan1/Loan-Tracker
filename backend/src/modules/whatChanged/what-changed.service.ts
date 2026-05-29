import { financeService } from "../finance/finance.service";
import { salaryService } from "../salary/salary.service";

const change = (metric: string, title: string, currentValue: number, previousValue: number) => {
  const changeAmount = currentValue - previousValue;
  const changePercent = previousValue ? Math.round((changeAmount / previousValue) * 100) : currentValue ? 100 : 0;
  const severity = changeAmount > 0 && ["Expenses", "Loan Repayments"].includes(metric) ? "WARNING" : changeAmount >= 0 ? "SUCCESS" : "INFO";
  return {
    id: metric.toLowerCase().replace(/\s+/g, "-"),
    metric,
    title,
    description: `${metric} ${changeAmount >= 0 ? "increased" : "decreased"} by Rs. ${Math.abs(changeAmount).toLocaleString()} compared to previous cycle.`,
    currentValue,
    previousValue,
    changeAmount,
    changePercent,
    severity,
  };
};

export const whatChangedService = {
  async list(userId: string) {
    const currentCycle = await salaryService.getCurrentCycle(userId);
    const previousDate = new Date(currentCycle.cycleStartDate);
    previousDate.setDate(previousDate.getDate() - 1);
    const previousCycle = await salaryService.getCurrentCycle(userId, previousDate);
    const [current, previous] = await Promise.all([
      financeService.dashboard(userId, { dateFrom: currentCycle.cycleStartDate, dateTo: currentCycle.cycleEndDate }),
      financeService.dashboard(userId, { dateFrom: previousCycle.cycleStartDate, dateTo: previousCycle.cycleEndDate }),
    ]);
    return [
      change("Expenses", "Expense movement", current.totalExpenses, previous.totalExpenses),
      change("Loan Repayments", "Loan repayment movement", current.loanRepayments, previous.loanRepayments),
      change("Loan Recoveries", "Loan recovery movement", current.loanRecovery, previous.loanRecovery),
      change("Income", "Income movement", current.totalInflows, previous.totalInflows),
      change("Savings Estimate", "Savings estimate movement", current.savingsEstimate, previous.savingsEstimate),
      change("Cash Spending", "Cash-flow movement", current.availableCash, previous.availableCash),
    ];
  },
};

import { CashFlowSummary } from "./cashFlowCalculator";

export type FinanceInsight = {
  id: string;
  type: string;
  title: string;
  description: string;
  severity: "INFO" | "SUCCESS" | "WARNING" | "DANGER";
  actionLabel?: string;
  actionRoute?: string;
  metadata?: Record<string, unknown>;
};

export const buildFinanceInsights = (summary: CashFlowSummary & {
  expectedSalary?: number;
  topExpenseCategory?: { name: string; amount: number } | null;
  budgetUsedPercent?: number;
  savingsTarget?: number;
  savingsEstimate?: number;
}): FinanceInsight[] => {
  const salaryBase = summary.salaryReceived || summary.expectedSalary || 0;
  const insights: FinanceInsight[] = [];

  if (salaryBase > 0) {
    const expensePercent = Math.round((summary.totalExpenses / salaryBase) * 100);
    insights.push({
      id: "salary-expense-percent",
      type: "SALARY_EXPENSE",
      title: `${expensePercent}% salary expenses mein gaya`,
      description: `Is cycle mein expenses ${summary.totalExpenses.toLocaleString("en-PK")} hain.`,
      severity: expensePercent > 80 ? "WARNING" : "INFO",
      actionLabel: "View budget",
      actionRoute: "Budget",
    });

    const loanPercent = Math.round((summary.loanRepayments / salaryBase) * 100);
    if (summary.loanRepayments > 0) {
      insights.push({
        id: "loan-impact",
        type: "LOAN_IMPACT",
        title: `${loanPercent}% salary loan repayments mein gaya`,
        description: `Loan repayment ne is cycle mein Rs. ${summary.loanRepayments.toLocaleString("en-PK")} outflow add kiya.`,
        severity: loanPercent > 35 ? "WARNING" : "INFO",
        actionLabel: "View report",
        actionRoute: "LoanImpactOnSalaryReport",
      });
    }
  }

  if (summary.loanRecovery > 0) {
    insights.push({
      id: "loan-recovery",
      type: "LOAN_RECOVERY",
      title: `Rs. ${summary.loanRecovery.toLocaleString("en-PK")} recovered`,
      description: "Loan recoveries ne cash inflow improve kiya.",
      severity: "SUCCESS",
    });
  }

  if (summary.topExpenseCategory) {
    insights.push({
      id: "top-expense-category",
      type: "TOP_EXPENSE_CATEGORY",
      title: `${summary.topExpenseCategory.name} biggest expense hai`,
      description: `Is category mein Rs. ${summary.topExpenseCategory.amount.toLocaleString("en-PK")} spend hua.`,
      severity: "INFO",
    });
  }

  insights.push({
    id: "available-cash",
    type: "AVAILABLE_CASH",
    title: `Remaining cash Rs. ${summary.availableCash.toLocaleString("en-PK")}`,
    description: "Available cash = salary + income + recovery - expenses - repayments.",
    severity: summary.availableCash >= 0 ? "SUCCESS" : "DANGER",
  });

  if ((summary.budgetUsedPercent || 0) > 100) {
    insights.push({
      id: "budget-exceeded",
      type: "BUDGET",
      title: "Budget exceeded",
      description: `Budget usage ${summary.budgetUsedPercent}% ho chuki hai.`,
      severity: "DANGER",
      actionRoute: "Budget",
    });
  }

  if (summary.savingsTarget && summary.savingsEstimate !== undefined) {
    insights.push({
      id: "savings-progress",
      type: "SAVINGS",
      title: summary.savingsEstimate >= summary.savingsTarget ? "Savings target on track" : "Savings target needs attention",
      description: `Estimated savings Rs. ${summary.savingsEstimate.toLocaleString("en-PK")}.`,
      severity: summary.savingsEstimate >= summary.savingsTarget ? "SUCCESS" : "WARNING",
    });
  }

  return insights;
};

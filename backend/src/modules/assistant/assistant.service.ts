import { financeService } from "../finance/finance.service";
import { forecastService } from "../forecast/forecast.service";
import { dashboardService } from "../dashboard/dashboard.service";
import { billService } from "../bills/bill.service";
import { affordabilityService } from "../affordability/affordability.service";

const includesAny = (text: string, words: string[]) => words.some((word) => text.includes(word));

export const assistantService = {
  async ask(userId: string, question: string) {
    const lower = question.toLowerCase();
    if (includesAny(lower, ["cash flow", "current cash", "available cash", "cash"])) {
      const dashboard = await financeService.dashboard(userId);
      return {
        answer: `Based on your entered data, available cash is Rs. ${dashboard.availableCash.toLocaleString()} and net cash flow is Rs. ${dashboard.netCashFlow.toLocaleString()}.`,
        cards: [{ title: "Available Cash", value: dashboard.availableCash }, { title: "Net Cash Flow", value: dashboard.netCashFlow }],
        relatedData: dashboard,
        suggestedActions: [{ label: "Open Money Dashboard", route: "Money" }],
      };
    }
    if (includesAny(lower, ["sabse zyada", "lene hain", "receivable", "top contact"])) {
      const contacts = await dashboardService.getTopContacts(userId, 5);
      return {
        answer: contacts[0] ? `${contacts[0].contactName} has the highest pending balance in your records.` : "No pending contact balances found yet.",
        cards: contacts,
        relatedData: contacts,
        suggestedActions: [{ label: "Open Contacts", route: "Contacts" }],
      };
    }
    if (includesAny(lower, ["expense", "biggest category", "salary percent"])) {
      const report = await financeService.salaryVsExpenseReport(userId);
      return {
        answer: `Expenses used ${report.expensePercentOfSalary}% of salary for the selected cycle.`,
        cards: [{ title: "Expense percent", value: report.expensePercentOfSalary }],
        relatedData: report,
        suggestedActions: [{ label: "Open Reports", route: "Reports" }],
      };
    }
    if (includesAny(lower, ["afford", "kharid", "buy"])) {
      const amount = Number(lower.replace(/,/g, "").match(/\d+/)?.[0] || 0);
      if (amount > 0) {
        const result = await affordabilityService.check(userId, { amount, plannedDate: new Date() });
        return {
          answer: `For Rs. ${amount.toLocaleString()}, result is ${result.result}. This is spending guidance based on your app data.`,
          cards: [result],
          relatedData: result,
          suggestedActions: [{ label: "Open Affordability", route: "AffordabilityCalculator" }],
        };
      }
    }
    if (includesAny(lower, ["bill", "upcoming"])) {
      const bills = await billService.upcoming(userId);
      return {
        answer: bills.length ? `${bills.length} upcoming bills found.` : "No upcoming bills found.",
        cards: bills,
        relatedData: bills,
        suggestedActions: [{ label: "Open Bills", route: "Bills" }],
      };
    }
    const forecast = await forecastService.build(userId);
    return {
      answer: "I can answer finance questions from your entered app data. Try asking about cash flow, biggest expense, upcoming bills, or affordability.",
      cards: [{ title: "Projected cash", value: forecast.projectedCash }],
      relatedData: forecast,
      suggestedActions: [{ label: "Open Cash Forecast", route: "CashForecast" }],
    };
  },
};

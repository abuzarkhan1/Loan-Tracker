import { Types } from "mongoose";
import { financeService } from "../finance/finance.service";
import { salaryService } from "../salary/salary.service";
import { auditLogService } from "../audit/audit-log.service";
import { ReviewModel } from "./review.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const buildReview = async (userId: string, date = new Date()) => {
  const cycle = await salaryService.getCurrentCycle(userId, date);
  const dashboard = await financeService.dashboard(userId, { dateFrom: cycle.cycleStartDate, dateTo: cycle.cycleEndDate });
  const categoryBreakdown = await financeService.categoryBreakdown(userId, { dateFrom: cycle.cycleStartDate, dateTo: cycle.cycleEndDate });
  const biggestCategory = categoryBreakdown[0];
  const highlights = [
    { title: "Salary received", description: `Salary received: Rs. ${dashboard.salaryReceived.toLocaleString()}`, severity: "SUCCESS" },
    { title: "Loan recovery", description: `Recovered Rs. ${dashboard.loanRecovery.toLocaleString()} from loans.`, severity: "INFO" },
    biggestCategory ? { title: "Biggest expense", description: `${biggestCategory.name} was the top category.`, severity: "INFO" } : undefined,
  ].filter(Boolean);
  const warnings = [
    dashboard.budgetUsedPercent > 100 ? { title: "Budget exceeded", description: `Budget usage reached ${dashboard.budgetUsedPercent}%.`, severity: "WARNING" } : undefined,
    dashboard.availableCash < 0 ? { title: "Negative cash flow", description: "Available cash ended below zero for this cycle.", severity: "DANGER" } : undefined,
  ].filter(Boolean);
  return { cycle, dashboard, categoryBreakdown, highlights, warnings };
};

export const reviewService = {
  async current(userId: string) {
    const built = await buildReview(userId);
    return ReviewModel.findOne({ userId: toObjectId(userId), cycleStartDate: built.cycle.cycleStartDate, cycleEndDate: built.cycle.cycleEndDate }) || this.generate(userId);
  },

  async generate(userId: string) {
    const built = await buildReview(userId);
    const review = await ReviewModel.findOneAndUpdate(
      { userId: toObjectId(userId), cycleStartDate: built.cycle.cycleStartDate, cycleEndDate: built.cycle.cycleEndDate },
      {
        $set: {
          summaryData: {
            salaryReceived: built.dashboard.salaryReceived,
            otherIncome: built.dashboard.otherIncome,
            expenses: built.dashboard.totalExpenses,
            loanRecoveries: built.dashboard.loanRecovery,
            loanRepayments: built.dashboard.loanRepayments,
            savingsEstimate: built.dashboard.savingsEstimate,
            cashFlowResult: built.dashboard.netCashFlow,
            biggestExpenseCategory: built.categoryBreakdown[0] || null,
          },
          highlights: built.highlights,
          warnings: built.warnings,
          status: "GENERATED",
        },
        $setOnInsert: { userId: toObjectId(userId), cycleStartDate: built.cycle.cycleStartDate, cycleEndDate: built.cycle.cycleEndDate },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    await auditLogService.record({
      userId,
      action: "REVIEW_GENERATED",
      entityType: "REVIEW",
      entityId: review._id.toString(),
      newValue: review.toObject(),
    });
    return review;
  },

  list(userId: string) {
    return ReviewModel.find({ userId: toObjectId(userId) }).sort({ cycleStartDate: -1 }).limit(24);
  },

  get(userId: string, id: string) {
    return ReviewModel.findOne({ _id: id, userId: toObjectId(userId) });
  },
};

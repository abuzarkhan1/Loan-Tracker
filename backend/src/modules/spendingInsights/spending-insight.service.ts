import { Types } from "mongoose";
import { percentageChange, spendingSeverity } from "../../utils/spendingHabits";
import { CategoryModel } from "../categories/category.model";
import { salaryService } from "../salary/salary.service";
import { TransactionModel } from "../transactions/transaction.model";

const toObjectId = (id: string | Types.ObjectId) => typeof id === "string" ? new Types.ObjectId(id) : id;

const previousCycleDate = (date: Date) => new Date(date.getTime() - 32 * 24 * 60 * 60 * 1000);

export const spendingInsightService = {
  async habits(userId: string, query: { date?: Date } = {}) {
    const currentCycle = await salaryService.getCurrentCycle(userId, query.date || new Date());
    const previousCycle = await salaryService.getCurrentCycle(userId, previousCycleDate(currentCycle.cycleStartDate));
    const user = toObjectId(userId);
    const [currentByCategory, previousByCategory, methodRows, dayRows] = await Promise.all([
      TransactionModel.aggregate([
        { $match: { userId: user, type: "EXPENSE", date: { $gte: currentCycle.cycleStartDate, $lte: currentCycle.cycleEndDate }, categoryId: { $ne: null } } },
        { $group: { _id: "$categoryId", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { amount: -1 } },
      ]),
      TransactionModel.aggregate([
        { $match: { userId: user, type: "EXPENSE", date: { $gte: previousCycle.cycleStartDate, $lte: previousCycle.cycleEndDate }, categoryId: { $ne: null } } },
        { $group: { _id: "$categoryId", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      TransactionModel.aggregate([
        { $match: { userId: user, type: "EXPENSE", date: { $gte: currentCycle.cycleStartDate, $lte: currentCycle.cycleEndDate } } },
        { $group: { _id: "$paymentMethod", amount: { $sum: "$amount" }, count: { $sum: 1 } } },
        { $sort: { amount: -1 } },
      ]),
      TransactionModel.aggregate([
        { $match: { userId: user, type: "EXPENSE", date: { $gte: currentCycle.cycleStartDate, $lte: currentCycle.cycleEndDate } } },
        { $group: { _id: { $dayOfWeek: "$date" }, amount: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
    ]);

    const categoryIds = currentByCategory.map((row) => row._id);
    const categories = await CategoryModel.find({ _id: { $in: categoryIds } }).select("name icon color");
    const topCategory = currentByCategory[0];
    const insights = [];
    if (topCategory) {
      const category = categories.find((item) => item._id.toString() === topCategory._id.toString());
      const previous = previousByCategory.find((row) => row._id?.toString() === topCategory._id.toString())?.amount || 0;
      const changePercent = percentageChange(topCategory.amount, previous);
      insights.push({
        id: "top-category",
        type: "TOP_CATEGORY",
        title: `${category?.name || "A category"} is your biggest expense`,
        description: `You spent Rs. ${topCategory.amount.toLocaleString()} here this cycle.`,
        severity: spendingSeverity(changePercent),
        currentValue: topCategory.amount,
        previousValue: previous,
        changePercent,
        relatedCategoryId: topCategory._id.toString(),
        actionLabel: "View trend",
      });
    }
    const weekend = dayRows.filter((row) => [1, 7].includes(row._id)).reduce((sum, row) => sum + row.amount, 0);
    const weekday = dayRows.filter((row) => ![1, 7].includes(row._id)).reduce((sum, row) => sum + row.amount, 0);
    if (weekend || weekday) {
      insights.push({
        id: "weekend-weekday",
        type: "WEEKEND_VS_WEEKDAY",
        title: weekend > weekday / 5 * 2 ? "Weekend spending is heavier" : "Weekday spending is steady",
        description: `Weekend spending Rs. ${weekend.toLocaleString()}, weekday spending Rs. ${weekday.toLocaleString()}.`,
        severity: weekend > weekday / 5 * 2 ? "WARNING" : "INFO",
        currentValue: weekend,
      });
    }
    const topMethod = methodRows[0];
    if (topMethod) {
      insights.push({
        id: "payment-method",
        type: "PAYMENT_METHOD_HABIT",
        title: `${topMethod._id} is your most used payment method`,
        description: `Rs. ${topMethod.amount.toLocaleString()} spent in ${topMethod.count} transactions.`,
        severity: "INFO",
        currentValue: topMethod.amount,
      });
    }
    return { cycle: currentCycle, insights };
  },

  async categoryTrend(userId: string, categoryId: string, query: { date?: Date } = {}) {
    const currentCycle = await salaryService.getCurrentCycle(userId, query.date || new Date());
    const previousCycle = await salaryService.getCurrentCycle(userId, previousCycleDate(currentCycle.cycleStartDate));
    const user = toObjectId(userId);
    const category = await CategoryModel.findOne({ _id: toObjectId(categoryId), userId: user }).select("name icon color");
    const [currentRows, previousRows, transactions] = await Promise.all([
      TransactionModel.aggregate([{ $match: { userId: user, type: "EXPENSE", categoryId: toObjectId(categoryId), date: { $gte: currentCycle.cycleStartDate, $lte: currentCycle.cycleEndDate } } }, { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } }]),
      TransactionModel.aggregate([{ $match: { userId: user, type: "EXPENSE", categoryId: toObjectId(categoryId), date: { $gte: previousCycle.cycleStartDate, $lte: previousCycle.cycleEndDate } } }, { $group: { _id: null, amount: { $sum: "$amount" }, count: { $sum: 1 } } }]),
      TransactionModel.find({ userId: user, type: "EXPENSE", categoryId: toObjectId(categoryId), date: { $gte: currentCycle.cycleStartDate, $lte: currentCycle.cycleEndDate } }).sort({ date: -1 }).limit(30),
    ]);
    const currentAmount = currentRows[0]?.amount || 0;
    const previousAmount = previousRows[0]?.amount || 0;
    return {
      category,
      currentCycle,
      previousCycle,
      currentAmount,
      previousAmount,
      changePercent: percentageChange(currentAmount, previousAmount),
      transactions,
    };
  },
};

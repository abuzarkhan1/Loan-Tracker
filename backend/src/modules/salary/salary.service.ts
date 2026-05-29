import { Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";
import { getCashFlowSummary } from "../../utils/cashFlowCalculator";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { getCycleStartEnd, getSalaryDateForCycle } from "../../utils/salaryCycle";
import { TransactionModel } from "../transactions/transaction.model";
import { transactionService } from "../transactions/transaction.service";
import { savingsGoalService } from "../savingsGoals/savings-goal.service";
import { NotificationLogModel } from "../reminders/notification-log.model";
import { ReminderType } from "../reminders/reminder.enums";
import { reminderService } from "../reminders/reminder.service";
import { SalaryAllocationModel, SalaryAllocationType } from "./salary-allocation.model";
import { SalaryEntryModel, SalaryEntryStatus } from "./salary-entry.model";
import { SalaryProfileModel, SalarySource } from "./salary-profile.model";

const toObjectId = (id: string | Types.ObjectId) => typeof id === "string" ? new Types.ObjectId(id) : id;

const normalize = (payload: Record<string, unknown>) => {
  const next = { ...payload };
  if (next.note === "") next.note = undefined;
  if (next.notes === "") next.notes = undefined;
  return next;
};

export const salaryService = {
  async getProfile(userId: string) {
    return SalaryProfileModel.findOne({ userId: toObjectId(userId) });
  },

  async upsertProfile(userId: string, payload: Record<string, unknown>) {
    return SalaryProfileModel.findOneAndUpdate(
      { userId: toObjectId(userId) },
      { $set: normalize(payload), $setOnInsert: { userId: toObjectId(userId) } },
      { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true },
    );
  },

  async getCurrentCycle(userId: string, date = new Date()) {
    const profile = await this.getProfile(userId);
    const cycle = getCycleStartEnd(profile?.cycleStartDay || 1, date);
    return {
      ...cycle,
      salaryDate: getSalaryDateForCycle(profile?.salaryDay || profile?.cycleStartDay || 1, cycle.cycleStartDate),
      profile,
    };
  },

  async createEntry(userId: string, payload: {
    amount: number;
    source: SalarySource;
    paymentMethod: PaymentMethod;
    salaryDate: Date;
    cycleStartDate?: Date;
    cycleEndDate?: Date;
    status?: SalaryEntryStatus;
    note?: string;
  }) {
    const cycle = payload.cycleStartDate && payload.cycleEndDate
      ? { cycleStartDate: payload.cycleStartDate, cycleEndDate: payload.cycleEndDate }
      : getCycleStartEnd((await this.getProfile(userId))?.cycleStartDay || 1, payload.salaryDate);
    const entry = await SalaryEntryModel.create({
      ...normalize(payload),
      userId: toObjectId(userId),
      cycleStartDate: cycle.cycleStartDate,
      cycleEndDate: cycle.cycleEndDate,
    });
    if (entry.status === "RECEIVED") {
      await this.markReceived(userId, entry._id.toString(), {});
    }
    return entry;
  },

  async ensureExpectedForCurrentCycle(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile?.autoCreateExpectedSalary || !profile.defaultAmount) return null;
    const cycle = await this.getCurrentCycle(userId);
    return SalaryEntryModel.findOneAndUpdate(
      { userId: toObjectId(userId), cycleStartDate: cycle.cycleStartDate, cycleEndDate: cycle.cycleEndDate, status: { $ne: "RECEIVED" } },
      {
        $setOnInsert: {
          userId: toObjectId(userId),
          amount: profile.defaultAmount,
          source: profile.source,
          paymentMethod: profile.paymentMethod,
          salaryDate: cycle.salaryDate,
          cycleStartDate: cycle.cycleStartDate,
          cycleEndDate: cycle.cycleEndDate,
          status: "EXPECTED",
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true },
    );
  },

  async listEntries(userId: string, filters: { status?: SalaryEntryStatus; dateFrom?: Date; dateTo?: Date; page: number; limit: number }) {
    await this.ensureExpectedForCurrentCycle(userId);
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.status) query.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      query.salaryDate = {
        ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { $lte: filters.dateTo } : {}),
      };
    }
    const limit = Math.min(filters.limit, 100);
    const [entries, total] = await Promise.all([
      SalaryEntryModel.find(query).populate("linkedTransactionId").sort({ salaryDate: -1 }).skip((filters.page - 1) * limit).limit(limit),
      SalaryEntryModel.countDocuments(query),
    ]);
    return { entries, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async getEntry(userId: string, id: string) {
    const entry = await SalaryEntryModel.findOne({ _id: id, userId: toObjectId(userId) }).populate("linkedTransactionId");
    if (!entry) throw new ApiError(404, "Salary entry not found");
    return entry;
  },

  async getCurrentCycleEntry(userId: string) {
    await this.ensureExpectedForCurrentCycle(userId);
    const cycle = await this.getCurrentCycle(userId);
    return SalaryEntryModel.findOne({ userId: toObjectId(userId), cycleStartDate: cycle.cycleStartDate, cycleEndDate: cycle.cycleEndDate }).sort({ createdAt: -1 });
  },

  async queueSalaryReminderIfDue(userId: string) {
    const profile = await this.getProfile(userId);
    if (!profile?.reminderEnabled) return null;

    const entry = await this.getCurrentCycleEntry(userId);
    if (!entry || entry.status !== "EXPECTED") return null;

    const start = new Date();
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setHours(23, 59, 59, 999);
    if (entry.salaryDate < start || entry.salaryDate > end) return null;

    const existing = await NotificationLogModel.findOne({
      userId: toObjectId(userId),
      type: ReminderType.CUSTOM,
      title: "Salary reminder",
      scheduledFor: { $gte: start, $lte: end },
    });
    if (existing) return existing;

    return reminderService.enqueueNotification({
      userId,
      type: ReminderType.CUSTOM,
      title: "Salary reminder",
      body: `Aaj ${entry.amount} salary expected hai. Receive ho gayi ho to mark received karein.`,
      scheduledFor: new Date().toISOString(),
    });
  },

  async updateEntry(userId: string, id: string, payload: Record<string, unknown>) {
    const entry = await SalaryEntryModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!entry) throw new ApiError(404, "Salary entry not found");
    entry.set(normalize(payload));
    await entry.save();
    if (entry.status === "RECEIVED" && entry.linkedTransactionId) {
      const transaction = await transactionService.upsertSalaryEntryTransaction(userId, entry);
      entry.linkedTransactionId = transaction._id;
      await entry.save();
    }
    return entry;
  },

  async markReceived(userId: string, id: string, payload: { amount?: number; salaryDate?: Date; paymentMethod?: PaymentMethod; note?: string }) {
    const entry = await SalaryEntryModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!entry) throw new ApiError(404, "Salary entry not found");
    if (payload.amount !== undefined) entry.amount = payload.amount;
    if (payload.salaryDate) entry.salaryDate = payload.salaryDate;
    if (payload.paymentMethod) entry.paymentMethod = payload.paymentMethod;
    if ("note" in payload) entry.note = payload.note || undefined;
    entry.status = "RECEIVED";
    const transaction = await transactionService.upsertSalaryEntryTransaction(userId, entry);
    entry.linkedTransactionId = transaction._id;
    await entry.save();
    return entry;
  },

  async markMissed(userId: string, id: string) {
    return this.updateEntry(userId, id, { status: "MISSED" });
  },

  async deleteEntry(userId: string, id: string) {
    const entry = await SalaryEntryModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!entry) throw new ApiError(404, "Salary entry not found");
    if (entry.linkedTransactionId) throw new ApiError(400, "Received salary entry has a linked transaction and cannot be deleted directly");
    await entry.deleteOne();
    return { id };
  },

  async getCycleSummary(userId: string, date = new Date()) {
    const cycle = await this.getCurrentCycle(userId, date);
    const expected = await SalaryEntryModel.findOne({ userId: toObjectId(userId), cycleStartDate: cycle.cycleStartDate, cycleEndDate: cycle.cycleEndDate }).sort({ createdAt: -1 });
    const cashFlow = await getCashFlowSummary(userId, cycle.cycleStartDate, cycle.cycleEndDate);
    const budgetUsedPercent = expected?.amount ? Math.round((cashFlow.totalExpenses / expected.amount) * 100) : 0;
    return {
      cycleStartDate: cycle.cycleStartDate,
      cycleEndDate: cycle.cycleEndDate,
      salaryDate: cycle.salaryDate,
      expectedSalary: expected?.amount || cycle.profile?.defaultAmount || 0,
      salaryEntry: expected,
      ...cashFlow,
      savingsEstimate: Math.max(cashFlow.availableCash, 0),
      budgetUsedPercent,
    };
  },

  async getDashboard(userId: string) {
    const summary = await this.getCycleSummary(userId);
    const profile = await this.getProfile(userId);
    return {
      ...summary,
      nextSalaryDate: summary.salaryDate,
      hasProfile: Boolean(summary.salaryEntry || profile),
    };
  },

  async listAllocations(userId: string, filters: { type?: SalaryAllocationType; date?: Date; page: number; limit: number }) {
    const cycle = await this.getCurrentCycle(userId, filters.date || new Date());
    const query: Record<string, unknown> = {
      userId: toObjectId(userId),
      cycleStartDate: cycle.cycleStartDate,
      cycleEndDate: cycle.cycleEndDate,
    };
    if (filters.type) query.type = filters.type;
    const limit = Math.min(filters.limit, 100);
    const [allocations, total] = await Promise.all([
      SalaryAllocationModel.find(query).populate("categoryId", "name type icon color").sort({ createdAt: -1 }).skip((filters.page - 1) * limit).limit(limit),
      SalaryAllocationModel.countDocuments(query),
    ]);
    const withUsage = await Promise.all(allocations.map((allocation) => this.recalculateAllocation(userId, allocation._id.toString())));
    return { allocations: withUsage, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async createAllocation(userId: string, payload: {
    salaryEntryId?: string;
    month?: number;
    year?: number;
    cycleStartDate?: Date;
    cycleEndDate?: Date;
    categoryId?: string;
    name: string;
    allocatedAmount: number;
    type: SalaryAllocationType;
  }) {
    const cycle = payload.cycleStartDate && payload.cycleEndDate
      ? { cycleStartDate: payload.cycleStartDate, cycleEndDate: payload.cycleEndDate }
      : await this.getCurrentCycle(userId);
    const allocation = await SalaryAllocationModel.create({
      ...payload,
      userId: toObjectId(userId),
      salaryEntryId: payload.salaryEntryId ? toObjectId(payload.salaryEntryId) : undefined,
      categoryId: payload.categoryId ? toObjectId(payload.categoryId) : undefined,
      cycleStartDate: cycle.cycleStartDate,
      cycleEndDate: cycle.cycleEndDate,
      remainingAmount: payload.allocatedAmount,
    });
    return this.recalculateAllocation(userId, allocation._id.toString());
  },

  async updateAllocation(userId: string, id: string, payload: Record<string, unknown>) {
    const allocation = await SalaryAllocationModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!allocation) throw new ApiError(404, "Salary allocation not found");
    allocation.set({
      ...payload,
      categoryId: payload.categoryId ? toObjectId(payload.categoryId as string) : allocation.categoryId,
    });
    await allocation.save();
    return this.recalculateAllocation(userId, id);
  },

  async deleteAllocation(userId: string, id: string) {
    const allocation = await SalaryAllocationModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!allocation) throw new ApiError(404, "Salary allocation not found");
    await allocation.deleteOne();
    return { id };
  },

  async recalculateAllocation(userId: string, id: string) {
    const allocation = await SalaryAllocationModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!allocation) throw new ApiError(404, "Salary allocation not found");
    const match: Record<string, unknown> = {
      userId: toObjectId(userId),
      date: { $gte: allocation.cycleStartDate, $lte: allocation.cycleEndDate },
    };
    if (allocation.type === "EXPENSE") match.type = "EXPENSE";
    if (allocation.type === "LOAN_REPAYMENT") match.type = "LOAN_REPAYMENT";
    if (allocation.categoryId) match.categoryId = allocation.categoryId;
    if (allocation.type === "SAVINGS") {
      allocation.usedAmount = await savingsGoalService.sumProgressInRange(userId, allocation.cycleStartDate, allocation.cycleEndDate);
    } else {
      const rows = await TransactionModel.aggregate([{ $match: match }, { $group: { _id: null, amount: { $sum: "$amount" } } }]);
      allocation.usedAmount = rows[0]?.amount || 0;
    }
    allocation.remainingAmount = Math.max(allocation.allocatedAmount - allocation.usedAmount, 0);
    await allocation.save();
    return allocation.populate("categoryId", "name type icon color");
  },

  async getAllocationSummary(userId: string, date = new Date()) {
    const { allocations } = await this.listAllocations(userId, { date, page: 1, limit: 100 });
    const allocatedAmount = allocations.reduce((sum, item) => sum + item.allocatedAmount, 0);
    const usedAmount = allocations.reduce((sum, item) => sum + item.usedAmount, 0);
    const salary = await this.getCycleSummary(userId, date);
    return {
      salaryAmount: salary.salaryReceived || salary.expectedSalary,
      allocatedAmount,
      usedAmount,
      unallocatedAmount: Math.max((salary.salaryReceived || salary.expectedSalary) - allocatedAmount, 0),
      remainingAmount: Math.max(allocatedAmount - usedAmount, 0),
      allocations,
    };
  },
};

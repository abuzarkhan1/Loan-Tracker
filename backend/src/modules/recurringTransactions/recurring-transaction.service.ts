import { Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { addFrequency, dateRangeFromQuery, occurrenceStatus, startOfDay } from "../../utils/recurrence";
import { CategoryModel } from "../categories/category.model";
import { TransactionModel } from "../transactions/transaction.model";
import { RecurringOccurrenceModel } from "./recurring-occurrence.model";
import { RecurringFrequency, RecurringTransactionModel, RecurringTransactionType } from "./recurring-transaction.model";

const toObjectId = (id: string | Types.ObjectId) => typeof id === "string" ? new Types.ObjectId(id) : id;

const validateCategory = async (userId: string, type: RecurringTransactionType, categoryId: string) => {
  const category = await CategoryModel.findOne({ _id: toObjectId(categoryId), userId: toObjectId(userId), type, isActive: true });
  if (!category) throw new ApiError(400, `${type.toLowerCase()} category not found`);
  return category._id;
};

const refreshStatus = async (occurrence: any) => {
  if (occurrence.status === "COMPLETED" || occurrence.status === "SKIPPED") return occurrence;
  const nextStatus = occurrenceStatus(occurrence.dueDate, false, {
    paid: "COMPLETED",
    upcoming: "UPCOMING",
    dueToday: "DUE_TODAY",
    overdue: "OVERDUE",
  });
  if (occurrence.status !== nextStatus) {
    occurrence.status = nextStatus;
    await occurrence.save();
  }
  return occurrence;
};

const normalize = (payload: Record<string, unknown>) => {
  const next = { ...payload };
  if (next.note === "") next.note = undefined;
  return next;
};

export const recurringTransactionService = {
  async create(userId: string, payload: {
    title: string;
    type: RecurringTransactionType;
    amount: number;
    categoryId: string;
    paymentMethod: PaymentMethod;
    frequency: RecurringFrequency;
    startDate: Date;
    endDate?: Date;
    nextRunDate?: Date;
    autoCreateTransaction: boolean;
    reminderEnabled: boolean;
    reminderDaysBefore: number;
    note?: string;
  }) {
    const categoryId = await validateCategory(userId, payload.type, payload.categoryId);
    const recurring = await RecurringTransactionModel.create({
      ...normalize(payload),
      userId: toObjectId(userId),
      categoryId,
      nextRunDate: payload.nextRunDate || payload.startDate,
    });
    await this.generateOccurrence(userId, recurring._id.toString());
    return recurring.populate("categoryId", "name icon color type");
  },

  async list(userId: string, filters: { type?: string; status?: string; search?: string; page: number; limit: number }) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.type) query.type = filters.type;
    if (filters.status) query.status = filters.status;
    if (filters.search) query.title = new RegExp(filters.search, "i");
    const limit = Math.min(filters.limit, 100);
    const [recurringTransactions, total] = await Promise.all([
      RecurringTransactionModel.find(query).populate("categoryId", "name icon color type").sort({ nextRunDate: 1 }).skip((filters.page - 1) * limit).limit(limit),
      RecurringTransactionModel.countDocuments(query),
    ]);
    return { recurringTransactions, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async get(userId: string, id: string) {
    const recurringTransaction = await RecurringTransactionModel.findOne({ _id: id, userId: toObjectId(userId) }).populate("categoryId", "name icon color type");
    if (!recurringTransaction) throw new ApiError(404, "Recurring transaction not found");
    const occurrences = await RecurringOccurrenceModel.find({ userId: toObjectId(userId), recurringTransactionId: recurringTransaction._id }).sort({ dueDate: -1 }).limit(12);
    await Promise.all(occurrences.map(refreshStatus));
    return { recurringTransaction, occurrences };
  },

  async update(userId: string, id: string, payload: Record<string, unknown>) {
    const recurring = await RecurringTransactionModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!recurring) throw new ApiError(404, "Recurring transaction not found");
    const categoryId = payload.categoryId ? await validateCategory(userId, (payload.type as RecurringTransactionType) || recurring.type, payload.categoryId as string) : recurring.categoryId;
    recurring.set({
      ...normalize(payload),
      categoryId,
      ...(payload.startDate && !payload.nextRunDate ? { nextRunDate: payload.startDate } : {}),
    });
    await recurring.save();
    return recurring.populate("categoryId", "name icon color type");
  },

  async delete(userId: string, id: string) {
    const recurring = await RecurringTransactionModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!recurring) throw new ApiError(404, "Recurring transaction not found");
    await RecurringOccurrenceModel.deleteMany({ userId: toObjectId(userId), recurringTransactionId: recurring._id, linkedTransactionId: { $exists: false } });
    await recurring.deleteOne();
    return { id };
  },

  async setStatus(userId: string, id: string, status: "ACTIVE" | "PAUSED" | "CANCELLED") {
    const recurring = await RecurringTransactionModel.findOneAndUpdate({ _id: id, userId: toObjectId(userId) }, { $set: { status } }, { new: true });
    if (!recurring) throw new ApiError(404, "Recurring transaction not found");
    return recurring;
  },

  async generateOccurrence(userId: string, id: string) {
    const recurring = await RecurringTransactionModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!recurring) throw new ApiError(404, "Recurring transaction not found");
    if (recurring.status !== "ACTIVE") return null;
    const dueDate = startOfDay(recurring.nextRunDate);
    if (recurring.endDate && dueDate > recurring.endDate) {
      recurring.status = "COMPLETED";
      await recurring.save();
      return null;
    }
    const occurrence = await RecurringOccurrenceModel.findOneAndUpdate(
      { userId: toObjectId(userId), recurringTransactionId: recurring._id, dueDate },
      {
        $setOnInsert: {
          userId: toObjectId(userId),
          recurringTransactionId: recurring._id,
          type: recurring.type,
          title: recurring.title,
          amount: recurring.amount,
          dueDate,
          status: occurrenceStatus(dueDate, false, { paid: "COMPLETED", upcoming: "UPCOMING", dueToday: "DUE_TODAY", overdue: "OVERDUE" }),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    recurring.nextRunDate = addFrequency(dueDate, recurring.frequency);
    await recurring.save();
    return occurrence;
  },

  async occurrences(userId: string, id: string, filters: { status?: string; dateFrom?: Date; dateTo?: Date; page: number; limit: number }) {
    const exists = await RecurringTransactionModel.exists({ _id: id, userId: toObjectId(userId) });
    if (!exists) throw new ApiError(404, "Recurring transaction not found");
    const query: Record<string, unknown> = { userId: toObjectId(userId), recurringTransactionId: toObjectId(id) };
    if (filters.status) query.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      query.dueDate = {
        ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { $lte: filters.dateTo } : {}),
      };
    }
    const limit = Math.min(filters.limit, 100);
    const [occurrences, total] = await Promise.all([
      RecurringOccurrenceModel.find(query).sort({ dueDate: -1 }).skip((filters.page - 1) * limit).limit(limit),
      RecurringOccurrenceModel.countDocuments(query),
    ]);
    await Promise.all(occurrences.map(refreshStatus));
    return { occurrences, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async markCompleted(userId: string, occurrenceId: string, payload: { amount?: number; completedDate?: Date; paymentMethod?: PaymentMethod; note?: string }) {
    const occurrence = await RecurringOccurrenceModel.findOne({ _id: occurrenceId, userId: toObjectId(userId) });
    if (!occurrence) throw new ApiError(404, "Recurring occurrence not found");
    const recurring = await RecurringTransactionModel.findOne({ _id: occurrence.recurringTransactionId, userId: toObjectId(userId) });
    if (!recurring) throw new ApiError(404, "Recurring transaction not found");
    const amount = payload.amount || occurrence.amount;
    const completedDate = payload.completedDate || new Date();
    const transaction = await TransactionModel.findOneAndUpdate(
      { _id: occurrence.linkedTransactionId || new Types.ObjectId(), userId: toObjectId(userId) },
      {
        $set: {
          userId: toObjectId(userId),
          type: occurrence.type,
          amount,
          date: completedDate,
          categoryId: recurring.categoryId,
          source: `Recurring: ${recurring.title}`,
          paymentMethod: payload.paymentMethod || recurring.paymentMethod,
          note: payload.note || recurring.note,
          isAutoGenerated: true,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    occurrence.set({ amount, completedDate, status: "COMPLETED", linkedTransactionId: transaction._id });
    await occurrence.save();
    await this.generateOccurrence(userId, recurring._id.toString());
    return { occurrence, transaction };
  },

  async skip(userId: string, occurrenceId: string) {
    const occurrence = await RecurringOccurrenceModel.findOne({ _id: occurrenceId, userId: toObjectId(userId) });
    if (!occurrence) throw new ApiError(404, "Recurring occurrence not found");
    occurrence.status = "SKIPPED";
    await occurrence.save();
    await this.generateOccurrence(userId, occurrence.recurringTransactionId.toString());
    return occurrence;
  },

  async upcoming(userId: string, query: { dateFrom?: Date; dateTo?: Date } = {}) {
    const range = dateRangeFromQuery(query);
    const occurrences = await RecurringOccurrenceModel.find({
      userId: toObjectId(userId),
      status: { $in: ["UPCOMING", "DUE_TODAY"] },
      dueDate: { $gte: range.start, $lte: range.end },
    }).sort({ dueDate: 1 }).limit(30);
    await Promise.all(occurrences.map(refreshStatus));
    return occurrences;
  },

  async processDueAutoTransactions(userId?: string) {
    const now = new Date();
    const recurringQuery: Record<string, unknown> = {
      status: "ACTIVE",
      autoCreateTransaction: true,
    };
    if (userId) recurringQuery.userId = toObjectId(userId);
    const recurringRecords = await RecurringTransactionModel.find(recurringQuery).select("_id userId autoCreateTransaction");
    const recurringIds = recurringRecords.map((record) => record._id);
    if (!recurringIds.length) return { processed: 0 };
    const occurrences = await RecurringOccurrenceModel.find({
      recurringTransactionId: { $in: recurringIds },
      dueDate: { $lte: now },
      status: { $in: ["UPCOMING", "DUE_TODAY", "OVERDUE"] },
    });
    let processed = 0;
    for (const occurrence of occurrences) {
      try {
        await this.markCompleted(occurrence.userId.toString(), occurrence._id.toString(), {
          amount: occurrence.amount,
          completedDate: occurrence.dueDate,
        });
        processed += 1;
      } catch {
        // Individual failures are logged by the worker; keep processing the rest.
      }
    }
    return { processed };
  },
};

import { Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { addFrequency, dateRangeFromQuery, occurrenceStatus, startOfDay } from "../../utils/recurrence";
import { CategoryModel } from "../categories/category.model";
import { TransactionModel } from "../transactions/transaction.model";
import { BillOccurrenceModel } from "./bill-occurrence.model";
import { BillFrequency, BillModel } from "./bill.model";

const toObjectId = (id: string | Types.ObjectId) => typeof id === "string" ? new Types.ObjectId(id) : id;

const normalize = (payload: Record<string, unknown>) => {
  const next = { ...payload };
  if (next.note === "") next.note = undefined;
  return next;
};

const validateExpenseCategory = async (userId: string, categoryId?: string) => {
  if (!categoryId) return undefined;
  const category = await CategoryModel.findOne({ _id: toObjectId(categoryId), userId: toObjectId(userId), type: "EXPENSE", isActive: true });
  if (!category) throw new ApiError(400, "Expense category not found");
  return category._id;
};

const refreshOccurrenceStatus = async (occurrence: any) => {
  if (occurrence.status === "PAID" || occurrence.status === "SKIPPED") return occurrence;
  const nextStatus = occurrenceStatus(occurrence.dueDate, false, {
    paid: "PAID",
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

export const billService = {
  async create(userId: string, payload: {
    title: string;
    categoryId?: string;
    amount: number;
    paymentMethod: PaymentMethod;
    frequency: BillFrequency;
    dueDate: Date;
    nextDueDate?: Date;
    reminderEnabled: boolean;
    reminderDaysBefore: number;
    autoCreateExpense: boolean;
    note?: string;
  }) {
    const categoryId = await validateExpenseCategory(userId, payload.categoryId);
    const bill = await BillModel.create({
      ...normalize(payload),
      userId: toObjectId(userId),
      categoryId,
      nextDueDate: payload.nextDueDate || payload.dueDate,
    });
    await this.generateOccurrence(userId, bill._id.toString());
    return bill.populate("categoryId", "name icon color type");
  },

  async list(userId: string, filters: {
    status?: string;
    frequency?: string;
    search?: string;
    dateFrom?: Date;
    dateTo?: Date;
    page: number;
    limit: number;
  }) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.status) query.status = filters.status;
    if (filters.frequency) query.frequency = filters.frequency;
    if (filters.search) query.title = new RegExp(filters.search, "i");
    if (filters.dateFrom || filters.dateTo) {
      query.nextDueDate = {
        ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { $lte: filters.dateTo } : {}),
      };
    }
    const limit = Math.min(filters.limit, 100);
    const [bills, total] = await Promise.all([
      BillModel.find(query).populate("categoryId", "name icon color type").sort({ nextDueDate: 1 }).skip((filters.page - 1) * limit).limit(limit),
      BillModel.countDocuments(query),
    ]);
    return { bills, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async get(userId: string, id: string) {
    const bill = await BillModel.findOne({ _id: id, userId: toObjectId(userId) }).populate("categoryId", "name icon color type");
    if (!bill) throw new ApiError(404, "Bill not found");
    const occurrences = await BillOccurrenceModel.find({ userId: toObjectId(userId), billId: bill._id }).sort({ dueDate: -1 }).limit(12);
    await Promise.all(occurrences.map(refreshOccurrenceStatus));
    return { bill, occurrences };
  },

  async update(userId: string, id: string, payload: Record<string, unknown>) {
    const bill = await BillModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!bill) throw new ApiError(404, "Bill not found");
    const categoryId = await validateExpenseCategory(userId, payload.categoryId as string | undefined);
    bill.set({
      ...normalize(payload),
      ...(categoryId ? { categoryId } : {}),
      ...(payload.dueDate && !payload.nextDueDate ? { nextDueDate: payload.dueDate } : {}),
    });
    await bill.save();
    return bill.populate("categoryId", "name icon color type");
  },

  async delete(userId: string, id: string) {
    const bill = await BillModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!bill) throw new ApiError(404, "Bill not found");
    await BillOccurrenceModel.deleteMany({ userId: toObjectId(userId), billId: bill._id, linkedTransactionId: { $exists: false } });
    await bill.deleteOne();
    return { id };
  },

  async setStatus(userId: string, id: string, status: "PAUSED" | "ACTIVE" | "CANCELLED") {
    const bill = await BillModel.findOneAndUpdate({ _id: id, userId: toObjectId(userId) }, { $set: { status } }, { new: true });
    if (!bill) throw new ApiError(404, "Bill not found");
    return bill;
  },

  async generateOccurrence(userId: string, billId: string) {
    const bill = await BillModel.findOne({ _id: billId, userId: toObjectId(userId) });
    if (!bill) throw new ApiError(404, "Bill not found");
    if (bill.status !== "ACTIVE") return null;
    const dueDate = startOfDay(bill.nextDueDate);
    const occurrence = await BillOccurrenceModel.findOneAndUpdate(
      { userId: toObjectId(userId), billId: bill._id, dueDate },
      {
        $setOnInsert: {
          userId: toObjectId(userId),
          billId: bill._id,
          title: bill.title,
          amount: bill.amount,
          dueDate,
          status: occurrenceStatus(dueDate, false, { paid: "PAID", upcoming: "UPCOMING", dueToday: "DUE_TODAY", overdue: "OVERDUE" }),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true },
    );
    if (bill.frequency !== "ONCE") {
      bill.nextDueDate = addFrequency(dueDate, bill.frequency);
      await bill.save();
    }
    return occurrence;
  },

  async occurrences(userId: string, billId: string, filters: { status?: string; dateFrom?: Date; dateTo?: Date; page: number; limit: number }) {
    const bill = await BillModel.exists({ _id: billId, userId: toObjectId(userId) });
    if (!bill) throw new ApiError(404, "Bill not found");
    const query: Record<string, unknown> = { userId: toObjectId(userId), billId: toObjectId(billId) };
    if (filters.status) query.status = filters.status;
    if (filters.dateFrom || filters.dateTo) {
      query.dueDate = {
        ...(filters.dateFrom ? { $gte: filters.dateFrom } : {}),
        ...(filters.dateTo ? { $lte: filters.dateTo } : {}),
      };
    }
    const limit = Math.min(filters.limit, 100);
    const [occurrences, total] = await Promise.all([
      BillOccurrenceModel.find(query).sort({ dueDate: -1 }).skip((filters.page - 1) * limit).limit(limit),
      BillOccurrenceModel.countDocuments(query),
    ]);
    await Promise.all(occurrences.map(refreshOccurrenceStatus));
    return { occurrences, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  async markPaid(userId: string, occurrenceId: string, payload: { amount?: number; paidDate?: Date; paymentMethod?: PaymentMethod; note?: string }) {
    const occurrence = await BillOccurrenceModel.findOne({ _id: occurrenceId, userId: toObjectId(userId) });
    if (!occurrence) throw new ApiError(404, "Bill occurrence not found");
    const bill = await BillModel.findOne({ _id: occurrence.billId, userId: toObjectId(userId) });
    if (!bill) throw new ApiError(404, "Bill not found");
    const paidDate = payload.paidDate || new Date();
    const amount = payload.amount || occurrence.amount;
    const transaction = bill.autoCreateExpense
      ? await TransactionModel.findOneAndUpdate(
        { _id: occurrence.linkedTransactionId || new Types.ObjectId(), userId: toObjectId(userId) },
        {
          $set: {
            userId: toObjectId(userId),
            type: "EXPENSE",
            amount,
            date: paidDate,
            categoryId: bill.categoryId,
            source: `Bill: ${bill.title}`,
            paymentMethod: payload.paymentMethod || bill.paymentMethod,
            note: payload.note || occurrence.note,
            isAutoGenerated: true,
          },
        },
        { upsert: true, new: true, setDefaultsOnInsert: true },
      )
      : null;
    occurrence.set({
      amount,
      paidDate,
      status: "PAID",
      ...(transaction ? { linkedTransactionId: transaction._id } : {}),
      note: payload.note || occurrence.note,
    });
    await occurrence.save();
    if (bill.frequency !== "ONCE") await this.generateOccurrence(userId, bill._id.toString());
    return { occurrence, transaction };
  },

  async skip(userId: string, occurrenceId: string) {
    const occurrence = await BillOccurrenceModel.findOne({ _id: occurrenceId, userId: toObjectId(userId) });
    if (!occurrence) throw new ApiError(404, "Bill occurrence not found");
    occurrence.status = "SKIPPED";
    await occurrence.save();
    const bill = await BillModel.findOne({ _id: occurrence.billId, userId: toObjectId(userId) });
    if (bill && bill.frequency !== "ONCE") await this.generateOccurrence(userId, bill._id.toString());
    return occurrence;
  },

  async upcoming(userId: string, query: { dateFrom?: Date; dateTo?: Date } = {}) {
    const range = dateRangeFromQuery(query);
    const occurrences = await BillOccurrenceModel.find({
      userId: toObjectId(userId),
      status: { $in: ["UPCOMING", "DUE_TODAY"] },
      dueDate: { $gte: range.start, $lte: range.end },
    }).sort({ dueDate: 1 }).limit(30);
    await Promise.all(occurrences.map(refreshOccurrenceStatus));
    return occurrences;
  },

  async overdue(userId: string) {
    const occurrences = await BillOccurrenceModel.find({
      userId: toObjectId(userId),
      status: { $in: ["UPCOMING", "DUE_TODAY", "OVERDUE"] },
      dueDate: { $lt: startOfDay(new Date()) },
    }).sort({ dueDate: 1 }).limit(30);
    await Promise.all(occurrences.map(refreshOccurrenceStatus));
    return occurrences.filter((occurrence) => occurrence.status === "OVERDUE");
  },
};

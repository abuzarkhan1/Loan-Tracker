import { Types } from "mongoose";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { LoanModel } from "../loans/loan.model";
import { PaymentModel } from "../payments/payment.model";
import { PromiseModel } from "./promise.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const promiseService = {
  async create(userId: string, payload: { contactId: string; loanId: string; promisedAmount: number; promiseDate: Date; note?: string }) {
    const loan = await LoanModel.findOne({ _id: payload.loanId, userId, contactId: payload.contactId });
    if (!loan) throw new ApiError(404, "Loan not found");
    if (payload.promisedAmount > loan.remainingAmount) throw new ApiError(400, "Promise amount cannot exceed remaining amount");
    return PromiseModel.create({
      ...payload,
      userId: toObjectId(userId),
      contactId: toObjectId(payload.contactId),
      loanId: toObjectId(payload.loanId),
      note: payload.note || undefined,
    });
  },

  async list(userId: string, filters: { status?: string; contactId?: string; loanId?: string; page: number; limit: number }) {
    await this.markBrokenPastDue(userId);
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.status) query.status = filters.status;
    if (filters.contactId) query.contactId = toObjectId(filters.contactId);
    if (filters.loanId) query.loanId = toObjectId(filters.loanId);
    const limit = Math.min(filters.limit, 100);
    const [promises, total] = await Promise.all([
      PromiseModel.find(query).populate("contactId", "name phone").populate("loanId", "amount remainingAmount status").sort({ promiseDate: 1 }).skip((filters.page - 1) * limit).limit(limit),
      PromiseModel.countDocuments(query),
    ]);
    return { promises, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  contact(userId: string, contactId: string, page = 1, limit = 50) {
    return this.list(userId, { contactId, page, limit });
  },

  loan(userId: string, loanId: string, page = 1, limit = 50) {
    return this.list(userId, { loanId, page, limit });
  },

  async update(userId: string, id: string, payload: Record<string, unknown>) {
    const promise = await PromiseModel.findOne({ _id: id, userId });
    if (!promise) throw new ApiError(404, "Promise not found");
    if (payload.promisedAmount !== undefined) {
      const loan = await LoanModel.findOne({ _id: promise.loanId, userId });
      if (loan && Number(payload.promisedAmount) > loan.remainingAmount) throw new ApiError(400, "Promise amount cannot exceed remaining amount");
    }
    promise.set(payload);
    await promise.save();
    return promise;
  },

  markKept(userId: string, id: string) {
    return this.update(userId, id, { status: "KEPT", keptAt: new Date(), brokenAt: undefined });
  },

  markBroken(userId: string, id: string) {
    return this.update(userId, id, { status: "BROKEN", brokenAt: new Date() });
  },

  cancel(userId: string, id: string) {
    return this.update(userId, id, { status: "CANCELLED" });
  },

  async delete(userId: string, id: string) {
    const promise = await PromiseModel.findOne({ _id: id, userId });
    if (!promise) throw new ApiError(404, "Promise not found");
    await promise.deleteOne();
    return { id };
  },

  async markBrokenPastDue(userId: string) {
    const yesterday = new Date();
    yesterday.setHours(0, 0, 0, 0);
    await PromiseModel.updateMany({ userId, status: "PENDING", promiseDate: { $lt: yesterday } }, { $set: { status: "BROKEN", brokenAt: new Date() } });
  },

  async getPaymentPromiseSuggestion(userId: string, loanId: string, amount: number, paymentDate: Date) {
    const promise = await PromiseModel.findOne({
      userId,
      loanId,
      status: "PENDING",
      promisedAmount: { $lte: amount },
      promiseDate: { $gte: new Date(paymentDate.getTime() - 7 * 86_400_000) },
    }).sort({ promiseDate: 1 });
    if (!promise) return null;
    const paidAfterPromise = await PaymentModel.aggregate([
      { $match: { userId: toObjectId(userId), loanId: toObjectId(loanId), paymentDate: { $gte: promise.createdAt } } },
      { $group: { _id: null, amount: { $sum: "$amount" } } },
    ]);
    return {
      promiseId: promise._id.toString(),
      promisedAmount: promise.promisedAmount,
      paidAmount: paidAfterPromise[0]?.amount || amount,
      message: "This payment matches a pending promise. Mark promise as kept?",
    };
  },
};

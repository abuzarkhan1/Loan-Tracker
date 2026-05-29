import { Types } from "mongoose";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { ContactModel } from "../contacts/contact.model";
import { LoanModel } from "../loans/loan.model";
import { FollowUpModel } from "./follow-up.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

export const followUpService = {
  async ensureOwnership(userId: string, contactId: string, loanId?: string) {
    const contact = await ContactModel.findOne({ _id: contactId, userId }).select("_id");
    if (!contact) throw new ApiError(404, "Contact not found");
    if (loanId) {
      const loan = await LoanModel.findOne({ _id: loanId, userId, contactId }).select("_id");
      if (!loan) throw new ApiError(404, "Loan not found");
    }
  },

  async create(userId: string, payload: Record<string, unknown>) {
    await this.ensureOwnership(userId, String(payload.contactId), payload.loanId ? String(payload.loanId) : undefined);
    return FollowUpModel.create({
      ...payload,
      userId: toObjectId(userId),
      contactId: toObjectId(String(payload.contactId)),
      loanId: payload.loanId ? toObjectId(String(payload.loanId)) : undefined,
    });
  },

  async list(userId: string, filters: { channel?: string; status?: string; contactId?: string; loanId?: string; page: number; limit: number }) {
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.channel) query.channel = filters.channel;
    if (filters.status) query.status = filters.status;
    if (filters.contactId) query.contactId = toObjectId(filters.contactId);
    if (filters.loanId) query.loanId = toObjectId(filters.loanId);
    const limit = Math.min(filters.limit, 100);
    const [followUps, total] = await Promise.all([
      FollowUpModel.find(query).populate("contactId", "name phone").populate("loanId", "amount remainingAmount status").sort({ createdAt: -1 }).skip((filters.page - 1) * limit).limit(limit),
      FollowUpModel.countDocuments(query),
    ]);
    return { followUps, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  contact(userId: string, contactId: string, page = 1, limit = 50) {
    return this.list(userId, { contactId, page, limit });
  },

  loan(userId: string, loanId: string, page = 1, limit = 50) {
    return this.list(userId, { loanId, page, limit });
  },

  async update(userId: string, id: string, payload: Record<string, unknown>) {
    const followUp = await FollowUpModel.findOneAndUpdate({ _id: id, userId }, { $set: payload }, { new: true, runValidators: true });
    if (!followUp) throw new ApiError(404, "Follow-up not found");
    return followUp;
  },

  async delete(userId: string, id: string) {
    const followUp = await FollowUpModel.findOne({ _id: id, userId });
    if (!followUp) throw new ApiError(404, "Follow-up not found");
    await followUp.deleteOne();
    return { id };
  },

  snooze(userId: string, id: string, nextFollowUpAt: Date) {
    return this.update(userId, id, { nextFollowUpAt, status: "SNOOZED" });
  },
};

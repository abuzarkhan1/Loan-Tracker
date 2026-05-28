import { Types } from "mongoose";
import { LoanStatus, LoanType } from "../../constants/enums";
import { LoanModel } from "../loans/loan.model";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { ContactModel, IContact } from "./contact.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const normalizeContactPayload = <T extends Record<string, unknown>>(payload: T) => {
  const normalized = { ...payload };
  for (const key of ["phone", "email", "note"]) {
    if ((normalized as Record<string, unknown>)[key] === "") {
      (normalized as Record<string, unknown>)[key] = undefined;
    }
  }

  return normalized;
};

export const contactService = {
  async createContact(userId: string, payload: { name: string; phone?: string; email?: string; note?: string }) {
    return ContactModel.create({
      ...normalizeContactPayload(payload),
      userId,
    });
  },

  async getContacts(
    userId: string,
    query: { search?: string; page: number; limit: number },
  ) {
    const filter: Record<string, unknown> = { userId };

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
    }

    const skip = (query.page - 1) * query.limit;
    const [contacts, total] = await Promise.all([
      ContactModel.find(filter).sort({ name: 1 }).skip(skip).limit(query.limit),
      ContactModel.countDocuments(filter),
    ]);

    return {
      contacts,
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async getContactOrThrow(userId: string, contactId: string) {
    const contact = await ContactModel.findOne({ _id: contactId, userId });
    if (!contact) {
      throw new ApiError(404, "Contact not found");
    }

    return contact;
  },

  async getContactDetail(userId: string, contactId: string) {
    const contact = await this.getContactOrThrow(userId, contactId);
    const userObjectId = toObjectId(userId);
    const contactObjectId = toObjectId(contactId);

    const [summaryResult, recentLoans] = await Promise.all([
      LoanModel.aggregate([
        { $match: { userId: userObjectId, contactId: contactObjectId } },
        {
          $group: {
            _id: null,
            totalLoans: { $sum: 1 },
            totalGiven: {
              $sum: { $cond: [{ $eq: ["$type", LoanType.GIVEN] }, "$amount", 0] },
            },
            totalTaken: {
              $sum: { $cond: [{ $eq: ["$type", LoanType.TAKEN] }, "$amount", 0] },
            },
            totalReceivedBack: {
              $sum: { $cond: [{ $eq: ["$type", LoanType.GIVEN] }, "$paidAmount", 0] },
            },
            totalPaidBack: {
              $sum: { $cond: [{ $eq: ["$type", LoanType.TAKEN] }, "$paidAmount", 0] },
            },
            netReceivable: {
              $sum: { $cond: [{ $eq: ["$type", LoanType.GIVEN] }, "$remainingAmount", 0] },
            },
            netPayable: {
              $sum: { $cond: [{ $eq: ["$type", LoanType.TAKEN] }, "$remainingAmount", 0] },
            },
            activeLoans: {
              $sum: {
                $cond: [{ $in: ["$status", [LoanStatus.ACTIVE, LoanStatus.PARTIALLY_PAID]] }, 1, 0],
              },
            },
            completedLoans: {
              $sum: { $cond: [{ $eq: ["$status", LoanStatus.COMPLETED] }, 1, 0] },
            },
            overdueLoans: {
              $sum: { $cond: [{ $eq: ["$status", LoanStatus.OVERDUE] }, 1, 0] },
            },
          },
        },
      ]),
      LoanModel.find({ userId, contactId }).sort({ issueDate: -1, createdAt: -1 }).limit(5),
    ]);

    const summary = summaryResult[0] || {
      totalLoans: 0,
      totalGiven: 0,
      totalTaken: 0,
      totalReceivedBack: 0,
      totalPaidBack: 0,
      netReceivable: 0,
      netPayable: 0,
      activeLoans: 0,
      completedLoans: 0,
      overdueLoans: 0,
    };

    return {
      contact,
      summary: {
        ...summary,
        overallBalance: summary.netReceivable - summary.netPayable,
      },
      recentLoans,
    };
  },

  async updateContact(
    userId: string,
    contactId: string,
    payload: Partial<{ name: string; phone?: string; email?: string; note?: string }>,
  ) {
    const contact = await ContactModel.findOneAndUpdate(
      { _id: contactId, userId },
      { $set: normalizeContactPayload(payload) },
      { new: true, runValidators: true },
    );

    if (!contact) {
      throw new ApiError(404, "Contact not found");
    }

    return contact;
  },

  async deleteContact(userId: string, contactId: string) {
    const contact = await this.getContactOrThrow(userId, contactId);
    const activeLoans = await LoanModel.countDocuments({
      userId,
      contactId,
      remainingAmount: { $gt: 0 },
    });

    if (activeLoans > 0) {
      throw new ApiError(400, "Cannot delete contact while active loans exist");
    }

    await contact.deleteOne();

    return { id: contactId };
  },
};

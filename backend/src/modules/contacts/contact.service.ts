import { Types } from "mongoose";
import { LoanStatus, LoanType } from "../../constants/enums";
import { LoanModel } from "../loans/loan.model";
import { PaymentModel } from "../payments/payment.model";
import { ApiError } from "../../utils/apiError";
import { normalizeContactName, normalizePhone } from "../../utils/normalizePhone";
import { buildPaginationMeta } from "../../utils/pagination";
import { ContactModel, ContactSource, IContact } from "./contact.model";

const toObjectId = (id: string) => new Types.ObjectId(id);

const avatarColors = ["#f36f56", "#d95441", "#1b7d62", "#8a6d1f", "#ffd56a", "#6f6577"];

const getAvatarColor = (name: string) => {
  const total = name.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return avatarColors[total % avatarColors.length];
};

const normalizeContactPayload = <T extends Record<string, unknown>>(payload: T) => {
  const normalized = { ...payload };
  for (const key of ["phone", "email", "note"]) {
    if ((normalized as Record<string, unknown>)[key] === "") {
      (normalized as Record<string, unknown>)[key] = undefined;
    }
  }
  if (typeof normalized.phone === "string") {
    (normalized as Record<string, unknown>).normalizedPhone = normalizePhone(normalized.phone);
  }

  return normalized;
};

type DeviceContactPayload = {
  deviceContactId?: string;
  name: string;
  phone?: string;
  emails?: string[];
  source?: ContactSource;
};

const getContactSummaryMap = async (userId: string, contactIds: Types.ObjectId[]) => {
  if (!contactIds.length) return new Map<string, { netReceivable: number; netPayable: number; overallBalance: number; activeLoans: number }>();

  const rows = await LoanModel.aggregate([
    { $match: { userId: toObjectId(userId), contactId: { $in: contactIds } } },
    {
      $group: {
        _id: "$contactId",
        netReceivable: { $sum: { $cond: [{ $eq: ["$type", LoanType.GIVEN] }, "$remainingAmount", 0] } },
        netPayable: { $sum: { $cond: [{ $eq: ["$type", LoanType.TAKEN] }, "$remainingAmount", 0] } },
        activeLoans: { $sum: { $cond: [{ $gt: ["$remainingAmount", 0] }, 1, 0] } },
      },
    },
  ]);

  return new Map(
    rows.map((row) => [
      row._id.toString(),
      {
        netReceivable: row.netReceivable || 0,
        netPayable: row.netPayable || 0,
        overallBalance: (row.netReceivable || 0) - (row.netPayable || 0),
        activeLoans: row.activeLoans || 0,
      },
    ]),
  );
};

export const contactService = {
  async createContact(userId: string, payload: { name: string; phone?: string; email?: string; note?: string }) {
    return ContactModel.create({
      ...normalizeContactPayload(payload),
      userId,
      source: "MANUAL",
      avatarColor: getAvatarColor(payload.name),
    });
  },

  async getContacts(
    userId: string,
    query: { search?: string; sortBy?: "name" | "createdAt" | "updatedAt"; sortOrder?: "asc" | "desc"; page: number; limit: number },
  ) {
    const filter: Record<string, unknown> = { userId };

    if (query.search) {
      const regex = new RegExp(query.search, "i");
      filter.$or = [{ name: regex }, { phone: regex }, { email: regex }];
    }

    const skip = (query.page - 1) * query.limit;
    const sortField = query.sortBy || "name";
    const sortDirection = query.sortOrder === "desc" ? -1 : 1;
    const [contacts, total] = await Promise.all([
      ContactModel.find(filter).sort({ [sortField]: sortDirection, lastUsedAt: -1 }).skip(skip).limit(query.limit),
      ContactModel.countDocuments(filter),
    ]);

    return {
      contacts,
      pagination: buildPaginationMeta(query.page, query.limit, total),
    };
  },

  async getFavoriteContacts(userId: string, limit = 10) {
    const contacts = await ContactModel.find({ userId, isFavorite: true })
      .sort({ lastUsedAt: -1, updatedAt: -1 })
      .limit(limit);
    const summaries = await getContactSummaryMap(userId, contacts.map((contact) => contact._id as Types.ObjectId));

    return contacts.map((contact) => ({
      ...contact.toObject(),
      balanceSummary: summaries.get(contact._id.toString()) || {
        netReceivable: 0,
        netPayable: 0,
        overallBalance: 0,
        activeLoans: 0,
      },
    }));
  },

  async getRecentContacts(userId: string, limit = 10) {
    const contacts = await ContactModel.find({ userId, lastUsedAt: { $exists: true } })
      .sort({ lastUsedAt: -1 })
      .limit(limit);
    const summaries = await getContactSummaryMap(userId, contacts.map((contact) => contact._id as Types.ObjectId));

    return contacts.map((contact) => ({
      ...contact.toObject(),
      balanceSummary: summaries.get(contact._id.toString()) || {
        netReceivable: 0,
        netPayable: 0,
        overallBalance: 0,
        activeLoans: 0,
      },
    }));
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

  async getContactLedger(userId: string, contactId: string) {
    const detail = await this.getContactDetail(userId, contactId);
    const [loans, payments] = await Promise.all([
      LoanModel.find({ userId, contactId }).sort({ issueDate: -1, createdAt: -1 }),
      PaymentModel.find({ userId, contactId }).sort({ paymentDate: -1, createdAt: -1 }),
    ]);

    const loanTimeline = loans.map((loan) => ({
      id: loan._id.toString(),
      kind: "LOAN",
      date: loan.issueDate,
      amount: loan.amount,
      type: loan.type,
      status: loan.status,
      description: loan.description,
      remainingAmount: loan.remainingAmount,
      createdAt: loan.createdAt,
    }));

    const paymentTimeline = payments.map((payment) => ({
      id: payment._id.toString(),
      kind: "PAYMENT",
      date: payment.paymentDate,
      amount: payment.amount,
      type: payment.type,
      method: payment.method,
      note: payment.note,
      createdAt: payment.createdAt,
    }));

    return {
      contact: detail.contact,
      summary: detail.summary,
      loans,
      payments,
      timeline: [...loanTimeline, ...paymentTimeline].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    };
  },

  async matchContact(
    userId: string,
    payload: { phone?: string; name?: string; deviceContactId?: string },
  ) {
    const normalizedPhone = normalizePhone(payload.phone);
    const normalizedName = normalizeContactName(payload.name);

    if (normalizedPhone) {
      const contact = await ContactModel.findOne({ userId, normalizedPhone });
      if (contact) {
        return { contact, matchConfidence: 0.98, reason: "PHONE_MATCH" };
      }
    }

    if (payload.deviceContactId) {
      const contact = await ContactModel.findOne({ userId, deviceContactId: payload.deviceContactId });
      if (contact) {
        return { contact, matchConfidence: 0.9, reason: "DEVICE_CONTACT_ID_MATCH" };
      }
    }

    if (normalizedName) {
      const escaped = normalizedName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const contact = await ContactModel.findOne({
        userId,
        name: new RegExp(`^${escaped}$`, "i"),
      });
      if (contact) {
        return { contact, matchConfidence: 0.72, reason: "NAME_MATCH" };
      }
    }

    return { contact: null, matchConfidence: 0, reason: "NO_MATCH" };
  },

  async importDeviceContact(userId: string, payload: DeviceContactPayload) {
    const normalizedPhone = normalizePhone(payload.phone);
    const email = payload.emails?.find(Boolean);

    const match = await this.matchContact(userId, {
      phone: payload.phone,
      name: payload.name,
      deviceContactId: payload.deviceContactId,
    });

    if (match.contact) {
      match.contact.lastUsedAt = new Date();
      if (!match.contact.deviceContactId && payload.deviceContactId) match.contact.deviceContactId = payload.deviceContactId;
      if (match.contact.source === "MANUAL") match.contact.source = "DEVICE_CONTACT";
      if (!match.contact.normalizedPhone && normalizedPhone) match.contact.normalizedPhone = normalizedPhone;
      if (!match.contact.phone && payload.phone) match.contact.phone = payload.phone;
      if (!match.contact.email && email) match.contact.email = email.toLowerCase();
      await match.contact.save();
      return { contact: match.contact, imported: false, duplicate: true, match };
    }

    const contact = await ContactModel.create({
      userId,
      name: payload.name.trim(),
      phone: payload.phone || undefined,
      email: email ? email.toLowerCase() : undefined,
      source: "DEVICE_CONTACT",
      deviceContactId: payload.deviceContactId,
      normalizedPhone,
      lastUsedAt: new Date(),
      avatarColor: getAvatarColor(payload.name),
    });

    return {
      contact,
      imported: true,
      duplicate: false,
      match: { contact: null, matchConfidence: 0, reason: "NO_MATCH" },
    };
  },

  async bulkImportDeviceContacts(userId: string, contacts: DeviceContactPayload[]) {
    const importedContacts: IContact[] = [];
    const duplicates: Array<{ input: DeviceContactPayload; contact: IContact; reason: string }> = [];
    let skippedCount = 0;

    const seen = new Set<string>();
    for (const contactInput of contacts) {
      const name = contactInput.name?.trim();
      if (!name) {
        skippedCount += 1;
        continue;
      }

      const normalizedPhone = normalizePhone(contactInput.phone);
      const key = normalizedPhone || `${contactInput.deviceContactId || ""}:${normalizeContactName(name)}`;
      if (seen.has(key)) {
        skippedCount += 1;
        continue;
      }
      seen.add(key);

      const result = await this.importDeviceContact(userId, { ...contactInput, name });
      if (result.imported) {
        importedContacts.push(result.contact);
      } else {
        duplicates.push({
          input: contactInput,
          contact: result.contact,
          reason: result.match.reason,
        });
      }
    }

    return {
      importedCount: importedContacts.length,
      skippedCount,
      duplicateCount: duplicates.length,
      contacts: importedContacts,
      duplicates,
    };
  },

  async updateContact(
    userId: string,
    contactId: string,
    payload: Partial<{ name: string; phone?: string; email?: string; note?: string }>,
  ) {
    const normalized = normalizeContactPayload(payload);
    if (payload.name) {
      (normalized as Record<string, unknown>).avatarColor = getAvatarColor(payload.name);
    }

    const contact = await ContactModel.findOneAndUpdate(
      { _id: contactId, userId },
      { $set: normalized },
      { new: true, runValidators: true },
    );

    if (!contact) {
      throw new ApiError(404, "Contact not found");
    }

    return contact;
  },

  async setFavorite(userId: string, contactId: string, isFavorite: boolean) {
    const contact = await ContactModel.findOneAndUpdate(
      { _id: contactId, userId },
      { $set: { isFavorite, lastUsedAt: new Date() } },
      { new: true, runValidators: true },
    );

    if (!contact) {
      throw new ApiError(404, "Contact not found");
    }

    return contact;
  },

  async touchLastUsed(userId: string, contactId: string) {
    const contact = await ContactModel.findOneAndUpdate(
      { _id: contactId, userId },
      { $set: { lastUsedAt: new Date() } },
      { new: true, runValidators: true },
    );

    if (!contact) {
      throw new ApiError(404, "Contact not found");
    }

    return contact;
  },

  async getRelationship(userId: string, contactId: string) {
    const contact = await this.getContactOrThrow(userId, contactId);
    return contact.relationship || {};
  },

  async updateRelationship(userId: string, contactId: string, payload: Record<string, unknown>) {
    const normalized = { ...payload };
    if (normalized.privateNote === "") normalized.privateNote = undefined;
    const contact = await ContactModel.findOneAndUpdate(
      { _id: contactId, userId },
      { $set: { relationship: normalized, lastUsedAt: new Date() } },
      { new: true, runValidators: true },
    );
    if (!contact) throw new ApiError(404, "Contact not found");
    return contact.relationship || {};
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

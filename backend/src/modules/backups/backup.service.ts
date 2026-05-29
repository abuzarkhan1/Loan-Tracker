import crypto from "crypto";
import { Types } from "mongoose";
import { cacheInvalidation } from "../../cache/cache.invalidation";
import { ApiError } from "../../utils/apiError";
import { buildPaginationMeta } from "../../utils/pagination";
import { ContactModel } from "../contacts/contact.model";
import { InstallmentModel } from "../installments/installment.model";
import { LoanModel } from "../loans/loan.model";
import { PaymentModel } from "../payments/payment.model";
import { ReminderSettingsModel } from "../reminders/reminder-settings.model";
import { BackupModel, BackupStatus, BackupType } from "./backup.model";

type RestoreMode = "MERGE" | "REPLACE";

const toObjectId = (id: string) => new Types.ObjectId(id);
const withoutMongoFields = (doc: Record<string, unknown>) => {
  const { _id, __v, createdAt, updatedAt, ...rest } = doc;
  void _id;
  void __v;
  void createdAt;
  void updatedAt;
  return rest;
};

const remappedObjectId = (map: Map<string, Types.ObjectId>, value: unknown) => {
  const key = String(value || "");
  return map.get(key) || (Types.ObjectId.isValid(key) ? toObjectId(key) : value);
};

export const backupService = {
  async createBackup(userId: string) {
    const [contacts, loans, payments, installments, reminderSettings] = await Promise.all([
      ContactModel.find({ userId }).lean(),
      LoanModel.find({ userId }).lean(),
      PaymentModel.find({ userId }).lean(),
      InstallmentModel.find({ userId }).lean(),
      ReminderSettingsModel.findOne({ userId }).lean(),
    ]);

    const snapshot = {
      version: 1,
      createdAt: new Date().toISOString(),
      contacts,
      loans,
      payments,
      installments,
      reminderSettings,
    };
    const fileSize = Buffer.byteLength(JSON.stringify(snapshot), "utf8");

    const backup = await BackupModel.create({
      userId: toObjectId(userId),
      backupId: `backup_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`,
      status: BackupStatus.COMPLETED,
      backupType: BackupType.MANUAL,
      totalContacts: contacts.length,
      totalLoans: loans.length,
      totalPayments: payments.length,
      totalInstallments: installments.length,
      dataSnapshot: snapshot,
      fileSize,
    });

    return backup;
  },

  async getBackups(userId: string, filters: { page: number; limit: number }) {
    const limit = Math.min(filters.limit, 100);
    const query = { userId: toObjectId(userId) };
    const [backups, total] = await Promise.all([
      BackupModel.find(query).select("-dataSnapshot").sort({ createdAt: -1 }).skip((filters.page - 1) * limit).limit(limit),
      BackupModel.countDocuments(query),
    ]);
    return {
      backups,
      pagination: buildPaginationMeta(filters.page, limit, total),
    };
  },

  async getBackup(userId: string, backupId: string) {
    const backup = await BackupModel.findOne({ _id: backupId, userId });
    if (!backup) throw new ApiError(404, "Backup not found");
    return backup;
  },

  async deleteBackup(userId: string, backupId: string) {
    const backup = await this.getBackup(userId, backupId);
    await backup.deleteOne();
    return { id: backupId };
  },

  async restoreBackup(userId: string, backupId: string, mode: RestoreMode) {
    const backup = await this.getBackup(userId, backupId);
    if (!backup.dataSnapshot) {
      throw new ApiError(400, "Backup data is not available");
    }

    const snapshot = backup.dataSnapshot as {
      contacts?: Array<Record<string, unknown>>;
      loans?: Array<Record<string, unknown>>;
      payments?: Array<Record<string, unknown>>;
      installments?: Array<Record<string, unknown>>;
      reminderSettings?: Record<string, unknown> | null;
    };

    if (mode === "REPLACE") {
      await Promise.all([
        PaymentModel.deleteMany({ userId }),
        InstallmentModel.deleteMany({ userId }),
        LoanModel.deleteMany({ userId }),
        ContactModel.deleteMany({ userId }),
        ReminderSettingsModel.deleteMany({ userId }),
      ]);

      await ContactModel.insertMany((snapshot.contacts || []).map((doc) => ({ ...doc, userId: toObjectId(userId) })));
      await LoanModel.insertMany((snapshot.loans || []).map((doc) => ({ ...doc, userId: toObjectId(userId) })));
      await PaymentModel.insertMany((snapshot.payments || []).map((doc) => ({ ...doc, userId: toObjectId(userId) })));
      await InstallmentModel.insertMany((snapshot.installments || []).map((doc) => ({ ...doc, userId: toObjectId(userId) })));
      if (snapshot.reminderSettings) {
        await ReminderSettingsModel.create({ ...snapshot.reminderSettings, userId: toObjectId(userId) });
      }
    } else {
      const contactMap = new Map<string, Types.ObjectId>();
      const loanMap = new Map<string, Types.ObjectId>();

      for (const contact of snapshot.contacts || []) {
        const originalId = String(contact._id || "");
        const created = await ContactModel.create({ ...withoutMongoFields(contact), userId: toObjectId(userId) } as never);
        contactMap.set(originalId, created._id as Types.ObjectId);
      }

      for (const loan of snapshot.loans || []) {
        const originalId = String(loan._id || "");
        const originalContactId = String(loan.contactId || "");
        const created = await LoanModel.create({
          ...withoutMongoFields(loan),
          userId: toObjectId(userId),
          contactId: remappedObjectId(contactMap, originalContactId),
        } as never);
        loanMap.set(originalId, created._id as Types.ObjectId);
      }

      for (const payment of snapshot.payments || []) {
        await PaymentModel.create({
          ...withoutMongoFields(payment),
          userId: toObjectId(userId),
          loanId: remappedObjectId(loanMap, payment.loanId),
          contactId: remappedObjectId(contactMap, payment.contactId),
        } as never);
      }

      for (const installment of snapshot.installments || []) {
        await InstallmentModel.create({
          ...withoutMongoFields(installment),
          userId: toObjectId(userId),
          loanId: remappedObjectId(loanMap, installment.loanId),
        } as never);
      }
    }

    await cacheInvalidation.userChanged(userId);
    return {
      id: backupId,
      mode,
      restoredContacts: snapshot.contacts?.length || 0,
      restoredLoans: snapshot.loans?.length || 0,
      restoredPayments: snapshot.payments?.length || 0,
      restoredInstallments: snapshot.installments?.length || 0,
    };
  },
};

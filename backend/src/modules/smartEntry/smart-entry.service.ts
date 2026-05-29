import { Types } from "mongoose";
import { LoanStatus, LoanType, PaymentMethod } from "../../constants/enums";
import { cacheInvalidation } from "../../cache/cache.invalidation";
import { ApiError } from "../../utils/apiError";
import { parseSmartEntryText, SmartEntryLanguage } from "../../utils/smartEntryParser";
import { auditLogService } from "../audit/audit-log.service";
import { billService } from "../bills/bill.service";
import { CategoryModel } from "../categories/category.model";
import { categoryService } from "../categories/category.service";
import { ContactModel } from "../contacts/contact.model";
import { contactService } from "../contacts/contact.service";
import { LoanModel } from "../loans/loan.model";
import { loanService } from "../loans/loan.service";
import { paymentService } from "../payments/payment.service";
import { promiseService } from "../promises/promise.service";
import { recurringTransactionService } from "../recurringTransactions/recurring-transaction.service";
import { salaryService } from "../salary/salary.service";
import { transactionService } from "../transactions/transaction.service";
import { categorizationService } from "../categorization/categorization.service";
import { SmartEntryInputType, SmartEntryModel } from "./smart-entry.model";
import { privacySettingsService } from "../settings/privacy-settings.service";

const toObjectId = (id: string | Types.ObjectId) => typeof id === "string" ? new Types.ObjectId(id) : id;

const findCategory = async (userId: string, type: "INCOME" | "EXPENSE", categoryName?: string) => {
  await categoryService.ensureDefaults(userId);
  if (!categoryName) return undefined;
  return CategoryModel.findOne({ userId: toObjectId(userId), type, name: new RegExp(`^${categoryName}$`, "i"), isActive: true });
};

const findContactMatches = async (userId: string, name?: string) => {
  if (!name) return [];
  const contacts = await ContactModel.find({ userId: toObjectId(userId), name: new RegExp(name, "i") }).limit(5);
  return contacts.map((contact) => ({ contactId: contact._id.toString(), name: contact.name, phone: contact.phone }));
};

const getOrCreateContact = async (userId: string, parsed: Record<string, unknown>) => {
  if (typeof parsed.contactId === "string") return parsed.contactId;
  const contactName = typeof parsed.contactName === "string" ? parsed.contactName.trim() : "";
  if (!contactName) throw new ApiError(400, "Contact is required before confirming this entry");
  const existing = await ContactModel.findOne({ userId: toObjectId(userId), name: new RegExp(`^${contactName}$`, "i") });
  if (existing) return existing._id.toString();
  const contact = await contactService.createContact(userId, { name: contactName });
  return contact._id.toString();
};

const sanitizeParsedDataForHistory = (parsedData: Record<string, unknown>, transcriptSaved: boolean) => {
  if (transcriptSaved) return parsedData;
  const sanitized = { ...parsedData };
  delete sanitized.note;
  delete sanitized.description;
  return sanitized;
};

export const smartEntryService = {
  async parse(userId: string, payload: { inputType: SmartEntryInputType; text: string; language?: SmartEntryLanguage; saveTranscript?: boolean }) {
    const settings = await privacySettingsService.get(userId);
    if (!settings.smartEntryEnabled) throw new ApiError(403, "Smart entry is disabled in settings");
    if (payload.inputType === "VOICE" && !settings.voiceEntryEnabled) throw new ApiError(403, "Voice entry is disabled in settings");
    const effectiveLanguage = payload.language || settings.smartEntryLanguagePreference;
    const parsed = parseSmartEntryText(payload.text, effectiveLanguage);
    const contactMatches = await findContactMatches(userId, parsed.parsedData.contactName as string | undefined);
    const transcriptSaved = payload.inputType === "VOICE"
      ? Boolean(payload.saveTranscript ?? settings.saveVoiceTranscriptHistory)
      : Boolean(settings.saveSmartEntryHistory);
    const originalText = transcriptSaved ? payload.text : payload.inputType === "VOICE" ? "[Voice transcript not saved]" : "[Smart entry text not saved]";
    const smartEntry = await SmartEntryModel.create({
      userId: toObjectId(userId),
      inputType: payload.inputType,
      originalText,
      language: parsed.language,
      intent: parsed.intent,
      parsedData: sanitizeParsedDataForHistory(parsed.parsedData, transcriptSaved),
      confidence: parsed.confidence,
      missingFields: parsed.missingFields,
      audioStored: false,
      transcriptSaved,
      status: parsed.intent === "UNKNOWN" ? "FAILED" : "PARSED",
    });
    let categorySuggestion = null;
    if (parsed.intent === "CREATE_EXPENSE" || parsed.intent === "CREATE_INCOME") {
      categorySuggestion = await categorizationService.suggest(userId, {
        text: payload.text,
        amount: parsed.parsedData.amount as number | undefined,
        type: parsed.intent === "CREATE_EXPENSE" ? "EXPENSE" : "INCOME",
      });
    }
    await cacheInvalidation.phase8Changed(userId);
    return {
      parseId: smartEntry._id.toString(),
      intent: parsed.intent,
      confidence: parsed.confidence,
      parsed: parsed.parsedData,
      needsConfirmation: true,
      missingFields: parsed.missingFields,
      contactMatches,
      categorySuggestion,
    };
  },

  async confirm(userId: string, payload: { parseId: string; parsedData?: Record<string, unknown> }) {
    const smartEntry = await SmartEntryModel.findOne({ _id: payload.parseId, userId: toObjectId(userId) });
    if (!smartEntry) throw new ApiError(404, "Smart entry not found");
    if (smartEntry.status !== "PARSED") throw new ApiError(400, "Only parsed entries can be confirmed");
    const parsed = { ...smartEntry.parsedData, ...(payload.parsedData || {}) };
    const amount = Number(parsed.amount || parsed.promisedAmount);
    if (!amount || amount <= 0) throw new ApiError(400, "Amount is required before confirmation");

    let createdEntity: any;
    let entityType: string = smartEntry.intent;
    if (smartEntry.intent === "CREATE_LOAN") {
      const contactId = await getOrCreateContact(userId, parsed);
      createdEntity = await loanService.createLoan(userId, {
        contactId,
        type: parsed.loanType === "TAKEN" ? LoanType.TAKEN : LoanType.GIVEN,
        amount,
        issueDate: parsed.issueDate ? new Date(String(parsed.issueDate)) : new Date(),
        dueDate: parsed.dueDate ? new Date(String(parsed.dueDate)) : undefined,
        description: smartEntry.originalText,
      });
      entityType = "LOAN";
    } else if (smartEntry.intent === "ADD_PAYMENT") {
      const contactId = await getOrCreateContact(userId, parsed);
      const loanType = parsed.paymentDirection === "PAID" ? LoanType.TAKEN : LoanType.GIVEN;
      let loan = null;
      if (typeof parsed.loanId === "string" && Types.ObjectId.isValid(parsed.loanId)) {
        loan = await LoanModel.findOne({
          _id: toObjectId(parsed.loanId),
          userId: toObjectId(userId),
          contactId: toObjectId(contactId),
          remainingAmount: { $gt: 0 },
          status: { $ne: LoanStatus.COMPLETED },
        });
      } else {
        const candidates = await LoanModel.find({
          userId: toObjectId(userId),
          contactId: toObjectId(contactId),
          type: loanType,
          remainingAmount: { $gt: 0 },
          status: { $ne: LoanStatus.COMPLETED },
        }).sort({ dueDate: 1, createdAt: 1 }).limit(2);
        if (candidates.length > 1) {
          throw new ApiError(400, "Multiple active loans match this payment. Please select a loan before confirming.");
        }
        loan = candidates[0] || null;
      }
      if (!loan) throw new ApiError(400, "No active matching loan found for this payment");
      createdEntity = await paymentService.addPayment(userId, {
        loanId: loan._id.toString(),
        amount,
        method: (parsed.paymentMethod as PaymentMethod) || PaymentMethod.CASH,
        paymentDate: parsed.paymentDate ? new Date(String(parsed.paymentDate)) : new Date(),
        note: smartEntry.originalText,
      });
      entityType = "PAYMENT";
    } else if (smartEntry.intent === "CREATE_EXPENSE" || smartEntry.intent === "CREATE_INCOME") {
      const type = smartEntry.intent === "CREATE_EXPENSE" ? "EXPENSE" : "INCOME";
      const category = await findCategory(userId, type, parsed.categoryName as string | undefined);
      createdEntity = await transactionService.create(userId, {
        type,
        amount,
        categoryId: category?._id.toString(),
        source: type === "INCOME" ? String(parsed.categoryName || "Smart entry") : undefined,
        paymentMethod: (parsed.paymentMethod as PaymentMethod) || PaymentMethod.CASH,
        date: parsed.date ? new Date(String(parsed.date)) : new Date(),
        note: smartEntry.originalText,
      });
      entityType = "TRANSACTION";
    } else if (smartEntry.intent === "CREATE_SALARY") {
      createdEntity = await salaryService.createEntry(userId, {
        amount,
        source: (parsed.source as any) || "JOB",
        paymentMethod: (parsed.paymentMethod as PaymentMethod) || PaymentMethod.BANK,
        salaryDate: parsed.salaryDate ? new Date(String(parsed.salaryDate)) : new Date(),
        status: "RECEIVED",
        note: smartEntry.originalText,
      });
      entityType = "SALARY_ENTRY";
    } else if (smartEntry.intent === "CREATE_BILL") {
      const category = await findCategory(userId, "EXPENSE", parsed.categoryName as string | undefined);
      createdEntity = await billService.create(userId, {
        title: String(parsed.title || "Bill"),
        amount,
        categoryId: category?._id.toString(),
        paymentMethod: (parsed.paymentMethod as PaymentMethod) || PaymentMethod.CASH,
        frequency: (parsed.frequency as any) || "ONCE",
        dueDate: parsed.dueDate ? new Date(String(parsed.dueDate)) : new Date(),
        reminderEnabled: true,
        reminderDaysBefore: 2,
        autoCreateExpense: true,
        note: smartEntry.originalText,
      });
      entityType = "BILL";
    } else if (smartEntry.intent === "CREATE_RECURRING_TRANSACTION") {
      const category = await findCategory(userId, "EXPENSE", parsed.categoryName as string | undefined);
      if (!category) throw new ApiError(400, "Expense category is required for recurring transactions");
      createdEntity = await recurringTransactionService.create(userId, {
        title: String(parsed.title || "Recurring expense"),
        type: "EXPENSE",
        amount,
        categoryId: category._id.toString(),
        paymentMethod: (parsed.paymentMethod as PaymentMethod) || PaymentMethod.CASH,
        frequency: (parsed.frequency === "ONCE" ? "MONTHLY" : parsed.frequency as any) || "MONTHLY",
        startDate: parsed.dueDate ? new Date(String(parsed.dueDate)) : new Date(),
        autoCreateTransaction: false,
        reminderEnabled: true,
        reminderDaysBefore: 2,
        note: smartEntry.originalText,
      });
      entityType = "RECURRING_TRANSACTION";
    } else if (smartEntry.intent === "CREATE_PROMISE") {
      const contactId = await getOrCreateContact(userId, parsed);
      const loan = await LoanModel.findOne({ userId: toObjectId(userId), contactId: toObjectId(contactId), remainingAmount: { $gt: 0 }, status: { $ne: LoanStatus.COMPLETED } }).sort({ dueDate: 1, createdAt: 1 });
      if (!loan) throw new ApiError(400, "No active loan found for this promise");
      createdEntity = await promiseService.create(userId, {
        contactId,
        loanId: loan._id.toString(),
        promisedAmount: amount,
        promiseDate: parsed.promiseDate ? new Date(String(parsed.promiseDate)) : new Date(),
        note: smartEntry.originalText,
      });
      entityType = "PROMISE";
    } else {
      throw new ApiError(400, "This entry could not be confirmed because intent is unknown");
    }

    const entityId = createdEntity?._id || createdEntity?.payment?._id || createdEntity?.bill?._id;
    smartEntry.set({
      status: "CONFIRMED",
      parsedData: sanitizeParsedDataForHistory(parsed, smartEntry.transcriptSaved),
      createdEntityType: entityType,
      ...(entityId ? { createdEntityId: toObjectId(entityId) } : {}),
    });
    await smartEntry.save();
    await Promise.all([
      cacheInvalidation.financeChanged(userId),
      auditLogService.record({
        userId,
        action: "SMART_ENTRY_CONFIRMED",
        entityType: "SMART_ENTRY",
        entityId: smartEntry._id.toString(),
        newValue: smartEntry.toObject(),
      }),
    ]);
    return { smartEntry, createdEntityType: entityType, createdEntity };
  },

  async history(userId: string, filters: { page: number; limit: number }) {
    const limit = Math.min(filters.limit, 100);
    const [entries, total] = await Promise.all([
      SmartEntryModel.find({ userId: toObjectId(userId) }).sort({ createdAt: -1 }).skip((filters.page - 1) * limit).limit(limit),
      SmartEntryModel.countDocuments({ userId: toObjectId(userId) }),
    ]);
    return { entries, pagination: { page: filters.page, limit, total, totalPages: Math.ceil(total / limit) || 1 } };
  },

  async cancel(userId: string, id: string) {
    const entry = await SmartEntryModel.findOneAndUpdate({ _id: id, userId: toObjectId(userId), status: "PARSED" }, { $set: { status: "CANCELLED" } }, { new: true });
    if (!entry) throw new ApiError(404, "Smart entry not found or already finalized");
    await cacheInvalidation.phase8Changed(userId);
    return entry;
  },

  async delete(userId: string, id: string) {
    const entry = await SmartEntryModel.findOne({ _id: id, userId: toObjectId(userId) });
    if (!entry) throw new ApiError(404, "Smart entry not found");
    await entry.deleteOne();
    await cacheInvalidation.phase8Changed(userId);
    return { id };
  },

  async clearHistory(userId: string) {
    const result = await SmartEntryModel.deleteMany({ userId: toObjectId(userId) });
    await auditLogService.record({
      userId,
      action: "SMART_ENTRY_HISTORY_CLEARED",
      entityType: "SMART_ENTRY",
      metadata: { deletedCount: result.deletedCount || 0 },
    });
    await cacheInvalidation.phase8Changed(userId);
    return { deletedCount: result.deletedCount || 0 };
  },
};

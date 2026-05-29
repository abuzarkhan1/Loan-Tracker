import { Types } from "mongoose";
import { renderTemplate } from "../../utils/renderTemplate";
import { buildPaginationMeta } from "../../utils/pagination";
import { ApiError } from "../../utils/apiError";
import { LoanModel } from "../loans/loan.model";
import { UserModel } from "../auth/user.model";
import { ReminderTemplateModel } from "./reminder-template.model";

const toObjectId = (id: string) => new Types.ObjectId(id);
const defaultTemplates = [
  {
    name: "Friendly Roman Urdu",
    type: "FRIENDLY_ROMAN_URDU",
    channel: "WHATSAPP",
    language: "ROMAN_URDU",
    tone: "FRIENDLY",
    bodyTemplate: "Salam {contactName}, {remainingAmount} baqi hain. Due date {dueDate} hai. Jab possible ho update kar dein. - {appName}",
    isDefault: true,
  },
  {
    name: "Professional English",
    type: "PROFESSIONAL_ENGLISH",
    channel: "EMAIL",
    language: "ENGLISH",
    tone: "PROFESSIONAL",
    subjectTemplate: "Payment reminder - {contactName}",
    bodyTemplate: "Hi {contactName},\n\nThis is a reminder that {remainingAmount} remains pending for your {loanType} loan. Due date: {dueDate}.\n\nRegards,\n{userName}",
    isDefault: true,
  },
  {
    name: "Short WhatsApp",
    type: "SHORT_WHATSAPP",
    channel: "WHATSAPP",
    language: "ROMAN_URDU",
    tone: "NORMAL",
    bodyTemplate: "{contactName}, {remainingAmount} pending hain. Due: {dueDate}.",
    isDefault: true,
  },
] as const;

export const reminderTemplateService = {
  async ensureDefaults(userId: string) {
    const existing = await ReminderTemplateModel.countDocuments({ userId: toObjectId(userId), isDefault: true });
    if (existing) return;
    await ReminderTemplateModel.insertMany(defaultTemplates.map((template) => ({ ...template, userId: toObjectId(userId) })));
  },

  async getTemplates(userId: string, filters: { channel?: string; type?: string; page: number; limit: number }) {
    await this.ensureDefaults(userId);
    const query: Record<string, unknown> = { userId: toObjectId(userId) };
    if (filters.channel) query.channel = filters.channel;
    if (filters.type) query.type = filters.type;
    const limit = Math.min(filters.limit, 100);
    const [templates, total] = await Promise.all([
      ReminderTemplateModel.find(query).sort({ isDefault: -1, createdAt: -1 }).skip((filters.page - 1) * limit).limit(limit),
      ReminderTemplateModel.countDocuments(query),
    ]);
    return { templates, pagination: buildPaginationMeta(filters.page, limit, total) };
  },

  createTemplate(userId: string, payload: Record<string, unknown>) {
    return ReminderTemplateModel.create({ ...payload, userId: toObjectId(userId), isDefault: false });
  },

  async updateTemplate(userId: string, id: string, payload: Record<string, unknown>) {
    const template = await ReminderTemplateModel.findOneAndUpdate({ _id: id, userId }, { $set: payload }, { new: true, runValidators: true });
    if (!template) throw new ApiError(404, "Reminder template not found");
    return template;
  },

  async deleteTemplate(userId: string, id: string) {
    const template = await ReminderTemplateModel.findOne({ _id: id, userId });
    if (!template) throw new ApiError(404, "Reminder template not found");
    if (template.isDefault) throw new ApiError(400, "Default templates cannot be deleted");
    await template.deleteOne();
    return { id };
  },

  async preview(userId: string, payload: { templateId?: string; loanId: string; subjectTemplate?: string; bodyTemplate?: string }) {
    const loan = await LoanModel.findOne({ _id: payload.loanId, userId }).populate("contactId", "name");
    if (!loan) throw new ApiError(404, "Loan not found");
    const user = await UserModel.findById(userId).select("name");
    const template = payload.templateId ? await ReminderTemplateModel.findOne({ _id: payload.templateId, userId }) : null;
    const contactName = loan.contactId && typeof loan.contactId === "object" && "name" in loan.contactId
      ? String((loan.contactId as { name?: string }).name || "Contact")
      : "Contact";
    const dueDate = loan.dueDate ? loan.dueDate.toLocaleDateString("en-PK") : "No due date";
    const overdueDays = loan.dueDate && loan.dueDate.getTime() < Date.now() ? Math.floor((Date.now() - loan.dueDate.getTime()) / 86_400_000) : 0;
    const variables = {
      contactName,
      amount: `Rs ${loan.amount.toLocaleString("en-PK")}`,
      remainingAmount: `Rs ${loan.remainingAmount.toLocaleString("en-PK")}`,
      dueDate,
      overdueDays,
      loanType: loan.type,
      appName: "Loan Tracker",
      userName: user?.name || "Loan Tracker user",
    };
    const subject = renderTemplate(payload.subjectTemplate || template?.subjectTemplate || "Payment reminder - {contactName}", variables);
    const body = renderTemplate(payload.bodyTemplate || template?.bodyTemplate || defaultTemplates[0].bodyTemplate, variables);
    return { subject, body, variables };
  },
};

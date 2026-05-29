import mongoose, { Document, Schema, Types } from "mongoose";

export const EMAIL_TYPES = [
  "PAYMENT_RECEIPT_EMAIL",
  "LOAN_SUMMARY_EMAIL",
  "CONTACT_STATEMENT_EMAIL",
  "MONTHLY_REPORT_EMAIL",
  "WEEKLY_SUMMARY_EMAIL",
  "OVERDUE_REMINDER_EMAIL",
  "PAYMENT_REQUEST_EMAIL",
  "SETTLEMENT_CONFIRMATION_EMAIL",
] as const;

export const EMAIL_STATUSES = ["QUEUED", "SENT", "FAILED"] as const;
export type EmailType = (typeof EMAIL_TYPES)[number];
export type EmailStatus = (typeof EMAIL_STATUSES)[number];

export interface IEmailLog extends Document {
  userId: Types.ObjectId;
  contactId?: Types.ObjectId;
  loanId?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  receiptId?: Types.ObjectId;
  reportId?: Types.ObjectId;
  type: EmailType;
  toEmail: string;
  subject: string;
  message?: string;
  html?: string;
  status: EmailStatus;
  providerMessageId?: string;
  error?: string;
  sentAt?: Date;
  attachments?: Array<{ filename: string; path?: string; href?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

export interface IEmailPreferences extends Document {
  userId: Types.ObjectId;
  emailReportsEnabled: boolean;
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: "SUNDAY" | "MONDAY" | "TUESDAY" | "WEDNESDAY" | "THURSDAY" | "FRIDAY" | "SATURDAY";
  weeklySummaryTime: string;
  monthlyReportEnabled: boolean;
  monthlyReportDay: number;
  overdueEmailEnabled: boolean;
  receiptEmailEnabled: boolean;
  defaultRecipientEmail?: string;
  createdAt: Date;
  updatedAt: Date;
}

const emailLogSchema = new Schema<IEmailLog>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", index: true },
    loanId: { type: Schema.Types.ObjectId, ref: "Loan", index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment", index: true },
    receiptId: { type: Schema.Types.ObjectId, ref: "Receipt", index: true },
    reportId: { type: Schema.Types.ObjectId, ref: "Report", index: true },
    type: { type: String, enum: EMAIL_TYPES, required: true, index: true },
    toEmail: { type: String, required: true, trim: true, lowercase: true, maxlength: 180 },
    subject: { type: String, required: true, trim: true, maxlength: 220 },
    message: { type: String, trim: true, maxlength: 4000 },
    html: { type: String },
    status: { type: String, enum: EMAIL_STATUSES, default: "QUEUED", required: true, index: true },
    providerMessageId: { type: String, trim: true },
    error: { type: String, trim: true, maxlength: 1000 },
    sentAt: { type: Date },
    attachments: [{ filename: String, path: String, href: String }],
  },
  { timestamps: true },
);

const emailPreferencesSchema = new Schema<IEmailPreferences>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    emailReportsEnabled: { type: Boolean, default: false, required: true },
    weeklySummaryEnabled: { type: Boolean, default: false, required: true },
    weeklySummaryDay: { type: String, enum: ["SUNDAY", "MONDAY", "TUESDAY", "WEDNESDAY", "THURSDAY", "FRIDAY", "SATURDAY"], default: "MONDAY" },
    weeklySummaryTime: { type: String, default: "09:00" },
    monthlyReportEnabled: { type: Boolean, default: false, required: true },
    monthlyReportDay: { type: Number, min: 1, max: 28, default: 1 },
    overdueEmailEnabled: { type: Boolean, default: true, required: true },
    receiptEmailEnabled: { type: Boolean, default: true, required: true },
    defaultRecipientEmail: { type: String, trim: true, lowercase: true, maxlength: 180 },
  },
  { timestamps: true },
);

emailLogSchema.index({ userId: 1, createdAt: -1 });
emailLogSchema.index({ userId: 1, status: 1, createdAt: -1 });

export const EmailLogModel = mongoose.model<IEmailLog>("EmailLog", emailLogSchema);
export const EmailPreferencesModel = mongoose.model<IEmailPreferences>("EmailPreferences", emailPreferencesSchema);

import mongoose, { Document, Schema, Types } from "mongoose";

export const LOAN_REMINDER_FREQUENCIES = ["DAILY", "EVERY_2_DAYS", "WEEKLY"] as const;
export const LOAN_REMINDER_TONES = ["POLITE", "NORMAL", "STRICT"] as const;

export type LoanReminderFrequency = (typeof LOAN_REMINDER_FREQUENCIES)[number];
export type LoanReminderTone = (typeof LOAN_REMINDER_TONES)[number];

export interface ILoanReminder extends Document {
  userId: Types.ObjectId;
  loanId: Types.ObjectId;
  enabled: boolean;
  remindBeforeDays: number;
  repeatUntilPaid: boolean;
  repeatFrequency: LoanReminderFrequency;
  tone: LoanReminderTone;
  customMessage?: string;
  snoozedUntil?: Date;
  lastSentAt?: Date;
  nextReminderAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const loanReminderSchema = new Schema<ILoanReminder>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    loanId: { type: Schema.Types.ObjectId, ref: "Loan", required: true, index: true },
    enabled: { type: Boolean, default: true, required: true },
    remindBeforeDays: { type: Number, min: 0, max: 60, default: 1, required: true },
    repeatUntilPaid: { type: Boolean, default: false, required: true },
    repeatFrequency: { type: String, enum: LOAN_REMINDER_FREQUENCIES, default: "DAILY", required: true },
    tone: { type: String, enum: LOAN_REMINDER_TONES, default: "NORMAL", required: true },
    customMessage: { type: String, trim: true, maxlength: 500 },
    snoozedUntil: { type: Date },
    lastSentAt: { type: Date },
    nextReminderAt: { type: Date, index: true },
  },
  { timestamps: true },
);

loanReminderSchema.index({ userId: 1, loanId: 1 }, { unique: true });

export const LoanReminderModel = mongoose.model<ILoanReminder>("LoanReminder", loanReminderSchema);

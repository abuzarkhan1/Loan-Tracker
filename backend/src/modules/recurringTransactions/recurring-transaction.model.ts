import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";

export const RECURRING_TRANSACTION_TYPES = ["INCOME", "EXPENSE"] as const;
export const RECURRING_FREQUENCIES = ["WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"] as const;
export const RECURRING_STATUSES = ["ACTIVE", "PAUSED", "CANCELLED", "COMPLETED"] as const;
export type RecurringTransactionType = (typeof RECURRING_TRANSACTION_TYPES)[number];
export type RecurringFrequency = (typeof RECURRING_FREQUENCIES)[number];
export type RecurringStatus = (typeof RECURRING_STATUSES)[number];

export interface IRecurringTransaction extends Document {
  userId: Types.ObjectId;
  title: string;
  type: RecurringTransactionType;
  amount: number;
  categoryId: Types.ObjectId;
  paymentMethod: PaymentMethod;
  frequency: RecurringFrequency;
  startDate: Date;
  endDate?: Date;
  nextRunDate: Date;
  autoCreateTransaction: boolean;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  status: RecurringStatus;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const recurringTransactionSchema = new Schema<IRecurringTransaction>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: RECURRING_TRANSACTION_TYPES, required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true, default: PaymentMethod.CASH },
    frequency: { type: String, enum: RECURRING_FREQUENCIES, required: true, default: "MONTHLY" },
    startDate: { type: Date, required: true },
    endDate: { type: Date },
    nextRunDate: { type: Date, required: true, index: true },
    autoCreateTransaction: { type: Boolean, default: false, required: true },
    reminderEnabled: { type: Boolean, default: true, required: true },
    reminderDaysBefore: { type: Number, min: 0, max: 30, default: 2, required: true },
    status: { type: String, enum: RECURRING_STATUSES, default: "ACTIVE", required: true, index: true },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

recurringTransactionSchema.index({ userId: 1, status: 1, nextRunDate: 1 });

export const RecurringTransactionModel = mongoose.model<IRecurringTransaction>("RecurringTransaction", recurringTransactionSchema);

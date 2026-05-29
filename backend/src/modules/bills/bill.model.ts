import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";

export const BILL_FREQUENCIES = ["ONCE", "WEEKLY", "MONTHLY", "QUARTERLY", "YEARLY", "CUSTOM"] as const;
export const BILL_STATUSES = ["ACTIVE", "PAUSED", "CANCELLED", "COMPLETED"] as const;
export type BillFrequency = (typeof BILL_FREQUENCIES)[number];
export type BillStatus = (typeof BILL_STATUSES)[number];

export interface IBill extends Document {
  userId: Types.ObjectId;
  title: string;
  categoryId?: Types.ObjectId;
  amount: number;
  paymentMethod: PaymentMethod;
  frequency: BillFrequency;
  dueDate: Date;
  nextDueDate: Date;
  reminderEnabled: boolean;
  reminderDaysBefore: number;
  autoCreateExpense: boolean;
  status: BillStatus;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const billSchema = new Schema<IBill>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    amount: { type: Number, required: true, min: 0.01 },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true, default: PaymentMethod.CASH },
    frequency: { type: String, enum: BILL_FREQUENCIES, required: true, default: "MONTHLY", index: true },
    dueDate: { type: Date, required: true },
    nextDueDate: { type: Date, required: true, index: true },
    reminderEnabled: { type: Boolean, default: true, required: true },
    reminderDaysBefore: { type: Number, min: 0, max: 30, default: 2, required: true },
    autoCreateExpense: { type: Boolean, default: true, required: true },
    status: { type: String, enum: BILL_STATUSES, default: "ACTIVE", required: true, index: true },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

billSchema.index({ userId: 1, status: 1, nextDueDate: 1 });

export const BillModel = mongoose.model<IBill>("Bill", billSchema);

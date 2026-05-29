import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";
import { SALARY_SOURCES, SalarySource } from "./salary-profile.model";

export const SALARY_ENTRY_STATUSES = ["EXPECTED", "RECEIVED", "MISSED"] as const;
export type SalaryEntryStatus = (typeof SALARY_ENTRY_STATUSES)[number];

export interface ISalaryEntry extends Document {
  userId: Types.ObjectId;
  amount: number;
  source: SalarySource;
  paymentMethod: PaymentMethod;
  salaryDate: Date;
  cycleStartDate: Date;
  cycleEndDate: Date;
  status: SalaryEntryStatus;
  linkedTransactionId?: Types.ObjectId;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const salaryEntrySchema = new Schema<ISalaryEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    source: { type: String, enum: SALARY_SOURCES, default: "JOB", required: true },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.BANK, required: true },
    salaryDate: { type: Date, required: true, index: true },
    cycleStartDate: { type: Date, required: true, index: true },
    cycleEndDate: { type: Date, required: true, index: true },
    status: { type: String, enum: SALARY_ENTRY_STATUSES, default: "EXPECTED", required: true, index: true },
    linkedTransactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

salaryEntrySchema.index({ userId: 1, cycleStartDate: 1, cycleEndDate: 1 });
salaryEntrySchema.index({ userId: 1, salaryDate: -1 });

export const SalaryEntryModel = mongoose.model<ISalaryEntry>("SalaryEntry", salaryEntrySchema);

import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";

export const SALARY_FREQUENCIES = ["MONTHLY", "WEEKLY", "BIWEEKLY", "CUSTOM"] as const;
export const SALARY_SOURCES = ["JOB", "FREELANCE", "BUSINESS", "OTHER"] as const;
export type SalaryFrequency = (typeof SALARY_FREQUENCIES)[number];
export type SalarySource = (typeof SALARY_SOURCES)[number];

export interface ISalaryProfile extends Document {
  userId: Types.ObjectId;
  defaultAmount: number;
  frequency: SalaryFrequency;
  salaryDay: number;
  cycleStartDay: number;
  source: SalarySource;
  paymentMethod: PaymentMethod;
  autoCreateExpectedSalary: boolean;
  reminderEnabled: boolean;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const salaryProfileSchema = new Schema<ISalaryProfile>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    defaultAmount: { type: Number, required: true, min: 0 },
    frequency: { type: String, enum: SALARY_FREQUENCIES, default: "MONTHLY", required: true },
    salaryDay: { type: Number, min: 1, max: 28, default: 1, required: true },
    cycleStartDay: { type: Number, min: 1, max: 28, default: 1, required: true },
    source: { type: String, enum: SALARY_SOURCES, default: "JOB", required: true },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), default: PaymentMethod.BANK, required: true },
    autoCreateExpectedSalary: { type: Boolean, default: false },
    reminderEnabled: { type: Boolean, default: false },
    notes: { type: String, trim: true, maxlength: 1000 },
  },
  { timestamps: true },
);

export const SalaryProfileModel = mongoose.model<ISalaryProfile>("SalaryProfile", salaryProfileSchema);

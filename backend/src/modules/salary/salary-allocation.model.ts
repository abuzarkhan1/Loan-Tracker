import mongoose, { Document, Schema, Types } from "mongoose";

export const SALARY_ALLOCATION_TYPES = ["EXPENSE", "LOAN_REPAYMENT", "SAVINGS", "OTHER"] as const;
export type SalaryAllocationType = (typeof SALARY_ALLOCATION_TYPES)[number];

export interface ISalaryAllocation extends Document {
  userId: Types.ObjectId;
  salaryEntryId?: Types.ObjectId;
  month?: number;
  year?: number;
  cycleStartDate: Date;
  cycleEndDate: Date;
  categoryId?: Types.ObjectId;
  name: string;
  allocatedAmount: number;
  usedAmount: number;
  remainingAmount: number;
  type: SalaryAllocationType;
  createdAt: Date;
  updatedAt: Date;
}

const salaryAllocationSchema = new Schema<ISalaryAllocation>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    salaryEntryId: { type: Schema.Types.ObjectId, ref: "SalaryEntry" },
    month: { type: Number, min: 1, max: 12 },
    year: { type: Number, min: 2000, max: 2100 },
    cycleStartDate: { type: Date, required: true, index: true },
    cycleEndDate: { type: Date, required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category" },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    allocatedAmount: { type: Number, required: true, min: 0 },
    usedAmount: { type: Number, default: 0, min: 0 },
    remainingAmount: { type: Number, default: 0, min: 0 },
    type: { type: String, enum: SALARY_ALLOCATION_TYPES, required: true, default: "EXPENSE", index: true },
  },
  { timestamps: true },
);

salaryAllocationSchema.index({ userId: 1, cycleStartDate: 1, cycleEndDate: 1 });

export const SalaryAllocationModel = mongoose.model<ISalaryAllocation>("SalaryAllocation", salaryAllocationSchema);

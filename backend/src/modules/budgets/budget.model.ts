import mongoose, { Document, Schema, Types } from "mongoose";

export interface IBudget extends Document {
  userId: Types.ObjectId;
  cycleStartDate: Date;
  cycleEndDate: Date;
  month?: number;
  year?: number;
  totalBudget?: number;
  categoryBudgets: Array<{ categoryId: Types.ObjectId; amount: number }>;
  createdAt: Date;
  updatedAt: Date;
}

const categoryBudgetSchema = new Schema(
  {
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    amount: { type: Number, required: true, min: 0 },
  },
  { _id: false },
);

const budgetSchema = new Schema<IBudget>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cycleStartDate: { type: Date, required: true, index: true },
    cycleEndDate: { type: Date, required: true, index: true },
    month: { type: Number, min: 1, max: 12 },
    year: { type: Number, min: 2000, max: 2100 },
    totalBudget: { type: Number, min: 0 },
    categoryBudgets: { type: [categoryBudgetSchema], default: [] },
  },
  { timestamps: true },
);

budgetSchema.index({ userId: 1, cycleStartDate: 1, cycleEndDate: 1 }, { unique: true });

export const BudgetModel = mongoose.model<IBudget>("Budget", budgetSchema);

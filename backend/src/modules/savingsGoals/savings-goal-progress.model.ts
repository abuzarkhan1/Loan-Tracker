import mongoose, { Document, Schema, Types } from "mongoose";

export interface ISavingsGoalProgress extends Document {
  userId: Types.ObjectId;
  goalId: Types.ObjectId;
  amount: number;
  date: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const savingsGoalProgressSchema = new Schema<ISavingsGoalProgress>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    goalId: { type: Schema.Types.ObjectId, ref: "SavingsGoal", required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    date: { type: Date, required: true, default: Date.now, index: true },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

savingsGoalProgressSchema.index({ userId: 1, date: -1 });
savingsGoalProgressSchema.index({ userId: 1, goalId: 1, date: -1 });

export const SavingsGoalProgressModel = mongoose.model<ISavingsGoalProgress>("SavingsGoalProgress", savingsGoalProgressSchema);

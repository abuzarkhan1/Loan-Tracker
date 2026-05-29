import mongoose, { Document, Schema, Types } from "mongoose";

export const SAVINGS_GOAL_STATUSES = ["ACTIVE", "COMPLETED", "PAUSED"] as const;
export type SavingsGoalStatus = (typeof SAVINGS_GOAL_STATUSES)[number];

export interface ISavingsGoal extends Document {
  userId: Types.ObjectId;
  name: string;
  targetAmount: number;
  currentAmount: number;
  monthlyTarget?: number;
  deadline?: Date;
  status: SavingsGoalStatus;
  createdAt: Date;
  updatedAt: Date;
}

const savingsGoalSchema = new Schema<ISavingsGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    targetAmount: { type: Number, required: true, min: 0.01 },
    currentAmount: { type: Number, required: true, default: 0, min: 0 },
    monthlyTarget: { type: Number, min: 0 },
    deadline: { type: Date },
    status: { type: String, enum: SAVINGS_GOAL_STATUSES, default: "ACTIVE", required: true, index: true },
  },
  { timestamps: true },
);

savingsGoalSchema.index({ userId: 1, status: 1 });

export const SavingsGoalModel = mongoose.model<ISavingsGoal>("SavingsGoal", savingsGoalSchema);

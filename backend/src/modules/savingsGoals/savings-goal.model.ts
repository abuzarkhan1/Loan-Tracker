import mongoose, { Document, Schema, Types } from "mongoose";

export const SAVINGS_GOAL_STATUSES = ["ACTIVE", "COMPLETED", "PAUSED"] as const;
export const SAVINGS_GOAL_TYPES = ["EMERGENCY_FUND", "BUY_LAPTOP", "BIKE", "EDUCATION", "FAMILY_SUPPORT", "BUSINESS_CAPITAL", "VACATION", "DEBT_PAYOFF", "CUSTOM"] as const;
export const SAVINGS_GOAL_PRIORITIES = ["LOW", "MEDIUM", "HIGH"] as const;
export type SavingsGoalStatus = (typeof SAVINGS_GOAL_STATUSES)[number];
export type SavingsGoalType = (typeof SAVINGS_GOAL_TYPES)[number];
export type SavingsGoalPriority = (typeof SAVINGS_GOAL_PRIORITIES)[number];

export interface ISavingsGoal extends Document {
  userId: Types.ObjectId;
  name: string;
  type: SavingsGoalType;
  targetAmount: number;
  currentAmount: number;
  monthlyTarget?: number;
  deadline?: Date;
  priority: SavingsGoalPriority;
  status: SavingsGoalStatus;
  autoContributionEnabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const savingsGoalSchema = new Schema<ISavingsGoal>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 100 },
    type: { type: String, enum: SAVINGS_GOAL_TYPES, default: "CUSTOM", required: true, index: true },
    targetAmount: { type: Number, required: true, min: 0.01 },
    currentAmount: { type: Number, required: true, default: 0, min: 0 },
    monthlyTarget: { type: Number, min: 0 },
    deadline: { type: Date },
    priority: { type: String, enum: SAVINGS_GOAL_PRIORITIES, default: "MEDIUM", required: true, index: true },
    status: { type: String, enum: SAVINGS_GOAL_STATUSES, default: "ACTIVE", required: true, index: true },
    autoContributionEnabled: { type: Boolean, default: false, required: true },
  },
  { timestamps: true },
);

savingsGoalSchema.index({ userId: 1, status: 1 });
// Smart goals planner queries active/high-priority goals frequently.
savingsGoalSchema.index({ userId: 1, priority: 1, deadline: 1 });

export const SavingsGoalModel = mongoose.model<ISavingsGoal>("SavingsGoal", savingsGoalSchema);

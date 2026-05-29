import mongoose, { Document, Schema, Types } from "mongoose";

export const ALERT_TYPES = [
  "BUDGET_80_PERCENT_USED",
  "BUDGET_EXCEEDED",
  "LOW_PROJECTED_CASH",
  "HIGH_LOAN_REPAYMENT_RATIO",
  "BILL_DUE_SOON",
  "BILL_OVERDUE",
  "RECURRING_TRANSACTION_DUE",
  "SAVINGS_GOAL_BEHIND",
  "SPENDING_SPIKE",
  "UPCOMING_HEAVY_OUTFLOW",
] as const;
export const ALERT_SEVERITIES = ["INFO", "SUCCESS", "WARNING", "DANGER"] as const;
export const ALERT_STATUSES = ["ACTIVE", "DISMISSED", "RESOLVED"] as const;
export type AlertType = (typeof ALERT_TYPES)[number];
export type AlertSeverity = (typeof ALERT_SEVERITIES)[number];
export type AlertStatus = (typeof ALERT_STATUSES)[number];

export interface IAlert extends Document {
  userId: Types.ObjectId;
  type: AlertType;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  relatedEntityType?: string;
  relatedEntityId?: Types.ObjectId;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const alertSchema = new Schema<IAlert>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type: { type: String, enum: ALERT_TYPES, required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    message: { type: String, required: true, trim: true, maxlength: 500 },
    severity: { type: String, enum: ALERT_SEVERITIES, default: "INFO", required: true, index: true },
    status: { type: String, enum: ALERT_STATUSES, default: "ACTIVE", required: true, index: true },
    relatedEntityType: { type: String, trim: true, maxlength: 80 },
    relatedEntityId: { type: Schema.Types.ObjectId },
    metadata: { type: Schema.Types.Mixed },
  },
  { timestamps: true },
);

alertSchema.index({ userId: 1, status: 1, createdAt: -1 });
alertSchema.index({ userId: 1, type: 1, relatedEntityId: 1, status: 1 });

export const AlertModel = mongoose.model<IAlert>("Alert", alertSchema);

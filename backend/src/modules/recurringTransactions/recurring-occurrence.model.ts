import mongoose, { Document, Schema, Types } from "mongoose";

export const RECURRING_OCCURRENCE_STATUSES = ["UPCOMING", "DUE_TODAY", "OVERDUE", "COMPLETED", "SKIPPED"] as const;
export type RecurringOccurrenceStatus = (typeof RECURRING_OCCURRENCE_STATUSES)[number];

export interface IRecurringOccurrence extends Document {
  userId: Types.ObjectId;
  recurringTransactionId: Types.ObjectId;
  type: "INCOME" | "EXPENSE";
  title: string;
  amount: number;
  dueDate: Date;
  completedDate?: Date;
  status: RecurringOccurrenceStatus;
  linkedTransactionId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const recurringOccurrenceSchema = new Schema<IRecurringOccurrence>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    recurringTransactionId: { type: Schema.Types.ObjectId, ref: "RecurringTransaction", required: true, index: true },
    type: { type: String, enum: ["INCOME", "EXPENSE"], required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    dueDate: { type: Date, required: true, index: true },
    completedDate: { type: Date },
    status: { type: String, enum: RECURRING_OCCURRENCE_STATUSES, default: "UPCOMING", required: true, index: true },
    linkedTransactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
  },
  { timestamps: true },
);

recurringOccurrenceSchema.index({ userId: 1, recurringTransactionId: 1, dueDate: 1 }, { unique: true });

export const RecurringOccurrenceModel = mongoose.model<IRecurringOccurrence>("RecurringOccurrence", recurringOccurrenceSchema);

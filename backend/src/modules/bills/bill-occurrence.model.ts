import mongoose, { Document, Schema, Types } from "mongoose";

export const BILL_OCCURRENCE_STATUSES = ["UPCOMING", "DUE_TODAY", "OVERDUE", "PAID", "SKIPPED"] as const;
export type BillOccurrenceStatus = (typeof BILL_OCCURRENCE_STATUSES)[number];

export interface IBillOccurrence extends Document {
  userId: Types.ObjectId;
  billId: Types.ObjectId;
  title: string;
  amount: number;
  dueDate: Date;
  paidDate?: Date;
  status: BillOccurrenceStatus;
  linkedTransactionId?: Types.ObjectId;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const billOccurrenceSchema = new Schema<IBillOccurrence>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    billId: { type: Schema.Types.ObjectId, ref: "Bill", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    amount: { type: Number, required: true, min: 0.01 },
    dueDate: { type: Date, required: true, index: true },
    paidDate: { type: Date },
    status: { type: String, enum: BILL_OCCURRENCE_STATUSES, default: "UPCOMING", required: true, index: true },
    linkedTransactionId: { type: Schema.Types.ObjectId, ref: "Transaction" },
    note: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

billOccurrenceSchema.index({ userId: 1, status: 1, dueDate: 1 });
billOccurrenceSchema.index({ userId: 1, billId: 1, dueDate: 1 }, { unique: true });

export const BillOccurrenceModel = mongoose.model<IBillOccurrence>("BillOccurrence", billOccurrenceSchema);

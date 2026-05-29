import mongoose, { Document, Schema, Types } from "mongoose";

export const PROMISE_STATUSES = ["PENDING", "KEPT", "BROKEN", "CANCELLED"] as const;
export type PromiseStatus = (typeof PROMISE_STATUSES)[number];

export interface IPromiseToPay extends Document {
  userId: Types.ObjectId;
  contactId: Types.ObjectId;
  loanId: Types.ObjectId;
  promisedAmount: number;
  promiseDate: Date;
  note?: string;
  status: PromiseStatus;
  keptAt?: Date;
  brokenAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const promiseSchema = new Schema<IPromiseToPay>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true, index: true },
    loanId: { type: Schema.Types.ObjectId, ref: "Loan", required: true, index: true },
    promisedAmount: { type: Number, required: true, min: 0.01 },
    promiseDate: { type: Date, required: true, index: true },
    note: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: PROMISE_STATUSES, default: "PENDING", required: true, index: true },
    keptAt: { type: Date },
    brokenAt: { type: Date },
  },
  { timestamps: true },
);

promiseSchema.index({ userId: 1, promiseDate: 1, status: 1 });

export const PromiseModel = mongoose.model<IPromiseToPay>("PromiseToPay", promiseSchema);

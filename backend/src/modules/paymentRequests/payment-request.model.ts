import mongoose, { Document, Schema, Types } from "mongoose";

export const PAYMENT_REQUEST_STATUSES = ["CREATED", "SHARED", "EMAIL_SENT", "CANCELLED", "PAID"] as const;
export type PaymentRequestStatus = (typeof PAYMENT_REQUEST_STATUSES)[number];

export interface IPaymentRequest extends Document {
  userId: Types.ObjectId;
  contactId: Types.ObjectId;
  loanId: Types.ObjectId;
  requestNumber: string;
  amountRequested: number;
  remainingAmount: number;
  dueDate?: Date;
  message: string;
  status: PaymentRequestStatus;
  publicToken: string;
  publicUrl?: string;
  expiresAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const paymentRequestSchema = new Schema<IPaymentRequest>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true, index: true },
    loanId: { type: Schema.Types.ObjectId, ref: "Loan", required: true, index: true },
    requestNumber: { type: String, required: true, unique: true, index: true },
    amountRequested: { type: Number, required: true, min: 0.01 },
    remainingAmount: { type: Number, required: true, min: 0 },
    dueDate: { type: Date },
    message: { type: String, required: true, trim: true, maxlength: 1000 },
    status: { type: String, enum: PAYMENT_REQUEST_STATUSES, default: "CREATED", required: true, index: true },
    publicToken: { type: String, required: true, unique: true, index: true },
    publicUrl: { type: String, trim: true },
    expiresAt: { type: Date, index: true },
  },
  { timestamps: true },
);

paymentRequestSchema.index({ userId: 1, createdAt: -1 });

export const PaymentRequestModel = mongoose.model<IPaymentRequest>("PaymentRequest", paymentRequestSchema);

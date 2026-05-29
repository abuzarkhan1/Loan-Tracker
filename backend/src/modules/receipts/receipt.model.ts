import mongoose, { Document, Schema, Types } from "mongoose";

export enum ReceiptType {
  PAYMENT_RECEIPT = "PAYMENT_RECEIPT",
  LOAN_SUMMARY_RECEIPT = "LOAN_SUMMARY_RECEIPT",
  CONTACT_STATEMENT_RECEIPT = "CONTACT_STATEMENT_RECEIPT",
}

export enum ReceiptStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  GENERATED = "GENERATED",
  FAILED = "FAILED",
}

export interface IReceipt extends Document {
  userId: Types.ObjectId;
  receiptNumber: string;
  type: ReceiptType;
  loanId?: Types.ObjectId;
  paymentId?: Types.ObjectId;
  contactId?: Types.ObjectId;
  title: string;
  status: ReceiptStatus;
  pdfUrl?: string;
  filePath?: string;
  fileName?: string;
  imageUrl?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const receiptSchema = new Schema<IReceipt>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    receiptNumber: { type: String, required: true, unique: true, index: true },
    type: { type: String, enum: Object.values(ReceiptType), required: true, index: true },
    loanId: { type: Schema.Types.ObjectId, ref: "Loan", index: true },
    paymentId: { type: Schema.Types.ObjectId, ref: "Payment", index: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", index: true },
    title: { type: String, required: true, trim: true, maxlength: 160 },
    status: { type: String, enum: Object.values(ReceiptStatus), default: ReceiptStatus.PENDING, required: true, index: true },
    pdfUrl: { type: String, trim: true },
    filePath: { type: String, trim: true },
    fileName: { type: String, trim: true },
    imageUrl: { type: String, trim: true },
    metadata: { type: Schema.Types.Mixed },
    error: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

receiptSchema.index({ userId: 1, createdAt: -1 });
receiptSchema.index({ userId: 1, type: 1, createdAt: -1 });

export const ReceiptModel = mongoose.model<IReceipt>("Receipt", receiptSchema);

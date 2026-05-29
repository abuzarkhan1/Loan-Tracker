import mongoose, { Document, Schema, Types } from "mongoose";
import { StorageType } from "../../../storage/storage.types";

export interface IPaymentProof extends Document {
  userId: Types.ObjectId;
  paymentId: Types.ObjectId;
  loanId: Types.ObjectId;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileUrl: string;
  storageType: StorageType;
  storagePath?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentProofSchema = new Schema<IPaymentProof>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    paymentId: {
      type: Schema.Types.ObjectId,
      ref: "Payment",
      required: true,
      unique: true,
      index: true,
    },
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
      index: true,
    },
    fileName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 255,
    },
    fileType: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    fileSize: {
      type: Number,
      required: true,
      min: 1,
    },
    fileUrl: {
      type: String,
      required: true,
      trim: true,
      maxlength: 1000,
    },
    storageType: {
      type: String,
      enum: ["LOCAL", "S3_READY"],
      default: "LOCAL",
      required: true,
    },
    storagePath: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true },
);

paymentProofSchema.index({ userId: 1, loanId: 1 });

export const PaymentProofModel = mongoose.model<IPaymentProof>("PaymentProof", paymentProofSchema);

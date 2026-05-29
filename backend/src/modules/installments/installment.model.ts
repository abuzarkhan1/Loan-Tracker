import mongoose, { Document, Schema, Types } from "mongoose";

export enum InstallmentStatus {
  UPCOMING = "UPCOMING",
  PARTIAL = "PARTIAL",
  PAID = "PAID",
  OVERDUE = "OVERDUE",
}

export interface IInstallment extends Document {
  userId: Types.ObjectId;
  loanId: Types.ObjectId;
  installmentNumber: number;
  dueDate: Date;
  expectedAmount: number;
  paidAmount: number;
  remainingAmount: number;
  status: InstallmentStatus;
  paidAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const installmentSchema = new Schema<IInstallment>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    loanId: {
      type: Schema.Types.ObjectId,
      ref: "Loan",
      required: true,
      index: true,
    },
    installmentNumber: {
      type: Number,
      required: true,
      min: 1,
    },
    dueDate: {
      type: Date,
      required: true,
      index: true,
    },
    expectedAmount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    paidAmount: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    remainingAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    status: {
      type: String,
      enum: Object.values(InstallmentStatus),
      default: InstallmentStatus.UPCOMING,
      required: true,
      index: true,
    },
    paidAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

installmentSchema.index({ userId: 1, loanId: 1, installmentNumber: 1 }, { unique: true });

export const InstallmentModel = mongoose.model<IInstallment>("Installment", installmentSchema);

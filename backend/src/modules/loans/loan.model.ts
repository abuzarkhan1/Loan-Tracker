import mongoose, { Document, Schema, Types } from "mongoose";
import { LoanStatus, LoanType } from "../../constants/enums";

export interface ILoan extends Document {
  userId: Types.ObjectId;
  contactId: Types.ObjectId;
  type: LoanType;
  amount: number;
  paidAmount: number;
  remainingAmount: number;
  issueDate: Date;
  dueDate?: Date;
  status: LoanStatus;
  description?: string;
  createdAt: Date;
  updatedAt: Date;
}

const loanSchema = new Schema<ILoan>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(LoanType),
      required: true,
    },
    amount: {
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
    issueDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    dueDate: {
      type: Date,
    },
    status: {
      type: String,
      enum: Object.values(LoanStatus),
      required: true,
      default: LoanStatus.ACTIVE,
      index: true,
    },
    description: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

loanSchema.index({ userId: 1, type: 1, status: 1 });
loanSchema.index({ userId: 1, issueDate: -1 });

export const LoanModel = mongoose.model<ILoan>("Loan", loanSchema);

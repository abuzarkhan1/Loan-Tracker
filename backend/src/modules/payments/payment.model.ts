import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentMethod, PaymentType } from "../../constants/enums";

export interface IPayment extends Document {
  userId: Types.ObjectId;
  loanId: Types.ObjectId;
  contactId: Types.ObjectId;
  amount: number;
  type: PaymentType;
  method: PaymentMethod;
  paymentDate: Date;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
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
    contactId: {
      type: Schema.Types.ObjectId,
      ref: "Contact",
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0.01,
    },
    type: {
      type: String,
      enum: Object.values(PaymentType),
      required: true,
    },
    method: {
      type: String,
      enum: Object.values(PaymentMethod),
      required: true,
      default: PaymentMethod.CASH,
    },
    paymentDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
  },
  { timestamps: true },
);

paymentSchema.index({ userId: 1, loanId: 1, paymentDate: -1 });

export const PaymentModel = mongoose.model<IPayment>("Payment", paymentSchema);

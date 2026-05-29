import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";

export const TRANSACTION_TEMPLATE_TYPES = ["INCOME", "EXPENSE"] as const;
export type TransactionTemplateType = (typeof TRANSACTION_TEMPLATE_TYPES)[number];

export interface ITransactionTemplate extends Document {
  userId: Types.ObjectId;
  title: string;
  type: TransactionTemplateType;
  amount: number;
  categoryId: Types.ObjectId;
  paymentMethod: PaymentMethod;
  note?: string;
  isFavorite: boolean;
  lastUsedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const transactionTemplateSchema = new Schema<ITransactionTemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: TRANSACTION_TEMPLATE_TYPES, required: true, index: true },
    amount: { type: Number, required: true, min: 0.01 },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod), required: true, default: PaymentMethod.CASH },
    note: { type: String, trim: true, maxlength: 500 },
    isFavorite: { type: Boolean, default: false, required: true, index: true },
    lastUsedAt: { type: Date },
  },
  { timestamps: true },
);

transactionTemplateSchema.index({ userId: 1, isFavorite: 1, lastUsedAt: -1 });

export const TransactionTemplateModel = mongoose.model<ITransactionTemplate>("TransactionTemplate", transactionTemplateSchema);

import mongoose, { Document, Schema, Types } from "mongoose";

export const SETTLEMENT_STATUSES = ["DRAFT", "SETTLED", "CANCELLED"] as const;
export type SettlementStatus = (typeof SETTLEMENT_STATUSES)[number];

export interface ISettlement extends Document {
  userId: Types.ObjectId;
  contactId: Types.ObjectId;
  loanId: Types.ObjectId;
  settlementNumber: string;
  finalAmount: number;
  paidAmount: number;
  remainingAmountAtSettlement: number;
  status: SettlementStatus;
  settlementNote?: string;
  receiptId?: Types.ObjectId;
  settledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const settlementSchema = new Schema<ISettlement>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true, index: true },
    loanId: { type: Schema.Types.ObjectId, ref: "Loan", required: true, index: true },
    settlementNumber: { type: String, required: true, unique: true, index: true },
    finalAmount: { type: Number, required: true, min: 0 },
    paidAmount: { type: Number, required: true, min: 0 },
    remainingAmountAtSettlement: { type: Number, required: true, min: 0 },
    status: { type: String, enum: SETTLEMENT_STATUSES, default: "SETTLED", required: true, index: true },
    settlementNote: { type: String, trim: true, maxlength: 1000 },
    receiptId: { type: Schema.Types.ObjectId, ref: "Receipt" },
    settledAt: { type: Date },
  },
  { timestamps: true },
);

settlementSchema.index({ userId: 1, createdAt: -1 });
settlementSchema.index({ userId: 1, loanId: 1 });

export const SettlementModel = mongoose.model<ISettlement>("Settlement", settlementSchema);

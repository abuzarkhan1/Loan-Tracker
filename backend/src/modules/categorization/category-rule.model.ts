import mongoose, { Document, Schema, Types } from "mongoose";
import { PaymentMethod } from "../../constants/enums";

export interface ICategoryRule extends Document {
  userId: Types.ObjectId;
  keyword: string;
  type: "INCOME" | "EXPENSE";
  categoryId: Types.ObjectId;
  paymentMethod?: PaymentMethod;
  confidence: number;
  createdFromUserFeedback: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const categoryRuleSchema = new Schema<ICategoryRule>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    keyword: { type: String, required: true, trim: true, lowercase: true, maxlength: 80 },
    type: { type: String, enum: ["INCOME", "EXPENSE"], required: true, index: true },
    categoryId: { type: Schema.Types.ObjectId, ref: "Category", required: true },
    paymentMethod: { type: String, enum: Object.values(PaymentMethod) },
    confidence: { type: Number, default: 0.75, min: 0, max: 1 },
    createdFromUserFeedback: { type: Boolean, default: false },
  },
  { timestamps: true },
);

categoryRuleSchema.index({ userId: 1, type: 1, keyword: 1 }, { unique: true });

export const CategoryRuleModel = mongoose.model<ICategoryRule>("CategoryRule", categoryRuleSchema);

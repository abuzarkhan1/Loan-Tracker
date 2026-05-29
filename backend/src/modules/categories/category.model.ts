import mongoose, { Document, Schema, Types } from "mongoose";

export const CATEGORY_TYPES = ["INCOME", "EXPENSE"] as const;
export type CategoryType = (typeof CATEGORY_TYPES)[number];

export interface ICategory extends Document {
  userId: Types.ObjectId;
  name: string;
  type: CategoryType;
  icon?: string;
  color?: string;
  isDefault: boolean;
  isActive: boolean;
  monthlyBudget?: number;
  createdAt: Date;
  updatedAt: Date;
}

const categorySchema = new Schema<ICategory>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 80 },
    type: { type: String, enum: CATEGORY_TYPES, required: true, index: true },
    icon: { type: String, trim: true, maxlength: 60 },
    color: { type: String, trim: true, maxlength: 20 },
    isDefault: { type: Boolean, default: false, index: true },
    isActive: { type: Boolean, default: true, index: true },
    monthlyBudget: { type: Number, min: 0 },
  },
  { timestamps: true },
);

categorySchema.index({ userId: 1, type: 1, name: 1 }, { unique: true });
categorySchema.index({ userId: 1, isActive: 1 });

export const CategoryModel = mongoose.model<ICategory>("Category", categorySchema);

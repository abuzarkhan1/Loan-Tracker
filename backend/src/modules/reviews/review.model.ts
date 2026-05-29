import mongoose, { Document, Schema, Types } from "mongoose";

export interface IReview extends Document {
  userId: Types.ObjectId;
  cycleStartDate: Date;
  cycleEndDate: Date;
  status: "GENERATED" | "ARCHIVED";
  summaryData: Record<string, unknown>;
  highlights: Array<{ title: string; description: string; severity?: string }>;
  warnings: Array<{ title: string; description: string; severity?: string }>;
  createdAt: Date;
  updatedAt: Date;
}

const reviewSchema = new Schema<IReview>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    cycleStartDate: { type: Date, required: true, index: true },
    cycleEndDate: { type: Date, required: true, index: true },
    status: { type: String, enum: ["GENERATED", "ARCHIVED"], default: "GENERATED", required: true },
    summaryData: { type: Schema.Types.Mixed, default: {} },
    highlights: [{ title: String, description: String, severity: String }],
    warnings: [{ title: String, description: String, severity: String }],
  },
  { timestamps: true },
);

reviewSchema.index({ userId: 1, cycleStartDate: 1, cycleEndDate: 1 }, { unique: true });

export const ReviewModel = mongoose.model<IReview>("Review", reviewSchema);

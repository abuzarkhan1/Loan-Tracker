import mongoose, { Document, Schema, Types } from "mongoose";

export interface IDataQualityResolution extends Document {
  userId: Types.ObjectId;
  issueId: string;
  status: "RESOLVED";
  resolvedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const dataQualityResolutionSchema = new Schema<IDataQualityResolution>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    issueId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    status: {
      type: String,
      enum: ["RESOLVED"],
      default: "RESOLVED",
      required: true,
    },
    resolvedAt: {
      type: Date,
      default: Date.now,
      required: true,
    },
  },
  { timestamps: true },
);

dataQualityResolutionSchema.index({ userId: 1, issueId: 1 }, { unique: true });

export const DataQualityResolutionModel = mongoose.model<IDataQualityResolution>("DataQualityResolution", dataQualityResolutionSchema);

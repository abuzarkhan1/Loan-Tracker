import mongoose, { Document, Schema, Types } from "mongoose";

export enum ReportType {
  CONTACT_STATEMENT = "CONTACT_STATEMENT",
  MONTHLY_REPORT = "MONTHLY_REPORT",
  COMPLETE_HISTORY = "COMPLETE_HISTORY",
  EXCEL_LOANS = "EXCEL_LOANS",
  EXCEL_PAYMENTS = "EXCEL_PAYMENTS",
  EXCEL_CONTACT = "EXCEL_CONTACT",
}

export enum ReportStatus {
  PENDING = "PENDING",
  PROCESSING = "PROCESSING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export interface IReport extends Document {
  userId: Types.ObjectId;
  type: ReportType;
  status: ReportStatus;
  fileUrl?: string;
  filePath?: string;
  fileName?: string;
  metadata?: Record<string, unknown>;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

const reportSchema = new Schema<IReport>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ReportType),
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: Object.values(ReportStatus),
      default: ReportStatus.PENDING,
      required: true,
      index: true,
    },
    fileUrl: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    filePath: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    fileName: {
      type: String,
      trim: true,
      maxlength: 255,
    },
    metadata: {
      type: Schema.Types.Mixed,
    },
    error: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    completedAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

reportSchema.index({ userId: 1, createdAt: -1 });

export const ReportModel = mongoose.model<IReport>("Report", reportSchema);

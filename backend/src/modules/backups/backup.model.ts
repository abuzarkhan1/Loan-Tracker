import mongoose, { Document, Schema, Types } from "mongoose";

export enum BackupStatus {
  PENDING = "PENDING",
  COMPLETED = "COMPLETED",
  FAILED = "FAILED",
}

export enum BackupType {
  MANUAL = "MANUAL",
  AUTO_LOCAL = "AUTO_LOCAL",
}

export interface IBackup extends Document {
  userId: Types.ObjectId;
  backupId: string;
  status: BackupStatus;
  backupType: BackupType;
  totalContacts: number;
  totalLoans: number;
  totalPayments: number;
  totalInstallments: number;
  fileUrl?: string;
  dataSnapshot?: Record<string, unknown>;
  fileSize?: number;
  error?: string;
  createdAt: Date;
  updatedAt: Date;
}

const backupSchema = new Schema<IBackup>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    backupId: { type: String, required: true, unique: true, index: true },
    status: { type: String, enum: Object.values(BackupStatus), default: BackupStatus.PENDING, required: true, index: true },
    backupType: { type: String, enum: Object.values(BackupType), default: BackupType.MANUAL, required: true },
    totalContacts: { type: Number, default: 0, required: true },
    totalLoans: { type: Number, default: 0, required: true },
    totalPayments: { type: Number, default: 0, required: true },
    totalInstallments: { type: Number, default: 0, required: true },
    fileUrl: { type: String, trim: true },
    dataSnapshot: { type: Schema.Types.Mixed },
    fileSize: { type: Number },
    error: { type: String, trim: true, maxlength: 500 },
  },
  { timestamps: true },
);

backupSchema.index({ userId: 1, createdAt: -1 });

export const BackupModel = mongoose.model<IBackup>("Backup", backupSchema);

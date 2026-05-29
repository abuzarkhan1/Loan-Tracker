import mongoose, { Document, Schema, Types } from "mongoose";
import { NotificationStatus, ReminderType } from "./reminder.enums";

export interface INotificationLog extends Document {
  userId: Types.ObjectId;
  loanId?: Types.ObjectId;
  type: ReminderType;
  title: string;
  body: string;
  status: NotificationStatus;
  error?: string;
  scheduledFor: Date;
  sentAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const notificationLogSchema = new Schema<INotificationLog>(
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
      index: true,
    },
    type: {
      type: String,
      enum: Object.values(ReminderType),
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    body: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: Object.values(NotificationStatus),
      default: NotificationStatus.PENDING,
      index: true,
    },
    error: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    scheduledFor: {
      type: Date,
      required: true,
      default: Date.now,
      index: true,
    },
    sentAt: {
      type: Date,
    },
  },
  { timestamps: true },
);

notificationLogSchema.index({ userId: 1, createdAt: -1 });
notificationLogSchema.index({ status: 1, scheduledFor: 1 });

export const NotificationLogModel = mongoose.model<INotificationLog>(
  "NotificationLog",
  notificationLogSchema,
);

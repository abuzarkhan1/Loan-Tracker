import mongoose, { Document, Schema, Types } from "mongoose";
import { WEEK_DAYS, WeekDay } from "./reminder.enums";

export interface IReminderSettings extends Document {
  userId: Types.ObjectId;
  dueSoonEnabled: boolean;
  dueSoonDaysBefore: number;
  overdueEnabled: boolean;
  dailySummaryEnabled: boolean;
  dailySummaryTime: string;
  weeklySummaryEnabled: boolean;
  weeklySummaryDay: WeekDay;
  weeklySummaryTime: string;
  pushToken?: string;
  timezone: string;
  createdAt: Date;
  updatedAt: Date;
}

const reminderSettingsSchema = new Schema<IReminderSettings>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    dueSoonEnabled: {
      type: Boolean,
      default: true,
    },
    dueSoonDaysBefore: {
      type: Number,
      default: 2,
      min: 0,
      max: 30,
    },
    overdueEnabled: {
      type: Boolean,
      default: true,
    },
    dailySummaryEnabled: {
      type: Boolean,
      default: false,
    },
    dailySummaryTime: {
      type: String,
      default: "20:00",
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    weeklySummaryEnabled: {
      type: Boolean,
      default: false,
    },
    weeklySummaryDay: {
      type: String,
      enum: WEEK_DAYS,
      default: "SUNDAY",
    },
    weeklySummaryTime: {
      type: String,
      default: "20:00",
      match: /^([01]\d|2[0-3]):[0-5]\d$/,
    },
    pushToken: {
      type: String,
      trim: true,
      maxlength: 250,
    },
    timezone: {
      type: String,
      default: "Asia/Karachi",
      trim: true,
      maxlength: 80,
    },
  },
  { timestamps: true },
);

export const ReminderSettingsModel = mongoose.model<IReminderSettings>(
  "ReminderSettings",
  reminderSettingsSchema,
);

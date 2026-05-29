import mongoose, { Document, Schema, Types } from "mongoose";

export const FOLLOW_UP_CHANNELS = ["WHATSAPP", "EMAIL", "CALL", "SMS", "IN_PERSON", "COPY"] as const;
export const FOLLOW_UP_TYPES = ["REMINDER", "PROMISE_DISCUSSION", "PAYMENT_REQUEST", "GENERAL"] as const;
export const FOLLOW_UP_STATUSES = ["SENT", "COPIED", "CALLED", "DISCUSSED", "SNOOZED", "FAILED"] as const;

export type FollowUpChannel = (typeof FOLLOW_UP_CHANNELS)[number];
export type FollowUpType = (typeof FOLLOW_UP_TYPES)[number];
export type FollowUpStatus = (typeof FOLLOW_UP_STATUSES)[number];

export interface IFollowUp extends Document {
  userId: Types.ObjectId;
  contactId: Types.ObjectId;
  loanId?: Types.ObjectId;
  channel: FollowUpChannel;
  type: FollowUpType;
  message?: string;
  note?: string;
  status: FollowUpStatus;
  nextFollowUpAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const followUpSchema = new Schema<IFollowUp>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    contactId: { type: Schema.Types.ObjectId, ref: "Contact", required: true, index: true },
    loanId: { type: Schema.Types.ObjectId, ref: "Loan", index: true },
    channel: { type: String, enum: FOLLOW_UP_CHANNELS, required: true, index: true },
    type: { type: String, enum: FOLLOW_UP_TYPES, default: "REMINDER", required: true },
    message: { type: String, trim: true, maxlength: 4000 },
    note: { type: String, trim: true, maxlength: 1000 },
    status: { type: String, enum: FOLLOW_UP_STATUSES, default: "SENT", required: true, index: true },
    nextFollowUpAt: { type: Date, index: true },
  },
  { timestamps: true },
);

followUpSchema.index({ userId: 1, createdAt: -1 });
followUpSchema.index({ userId: 1, contactId: 1, createdAt: -1 });

export const FollowUpModel = mongoose.model<IFollowUp>("FollowUp", followUpSchema);

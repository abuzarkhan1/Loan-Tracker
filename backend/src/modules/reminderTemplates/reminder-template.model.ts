import mongoose, { Document, Schema, Types } from "mongoose";

export const TEMPLATE_TYPES = ["POLITE", "NORMAL", "STRICT", "FRIENDLY_ROMAN_URDU", "PROFESSIONAL_ENGLISH", "SHORT_WHATSAPP", "EMAIL_STYLE"] as const;
export const TEMPLATE_CHANNELS = ["WHATSAPP", "EMAIL", "SMS", "COPY"] as const;
export const TEMPLATE_LANGUAGES = ["ROMAN_URDU", "ENGLISH", "URDU_STYLE"] as const;
export const TEMPLATE_TONES = ["POLITE", "NORMAL", "STRICT", "FRIENDLY", "PROFESSIONAL"] as const;

export type ReminderTemplateType = (typeof TEMPLATE_TYPES)[number];
export type ReminderTemplateChannel = (typeof TEMPLATE_CHANNELS)[number];
export type ReminderTemplateLanguage = (typeof TEMPLATE_LANGUAGES)[number];
export type ReminderTemplateTone = (typeof TEMPLATE_TONES)[number];

export interface IReminderTemplate extends Document {
  userId?: Types.ObjectId;
  name: string;
  type: ReminderTemplateType;
  channel: ReminderTemplateChannel;
  language: ReminderTemplateLanguage;
  tone: ReminderTemplateTone;
  subjectTemplate?: string;
  bodyTemplate: string;
  isDefault: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const reminderTemplateSchema = new Schema<IReminderTemplate>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    name: { type: String, required: true, trim: true, maxlength: 120 },
    type: { type: String, enum: TEMPLATE_TYPES, required: true, index: true },
    channel: { type: String, enum: TEMPLATE_CHANNELS, required: true, index: true },
    language: { type: String, enum: TEMPLATE_LANGUAGES, required: true },
    tone: { type: String, enum: TEMPLATE_TONES, required: true },
    subjectTemplate: { type: String, trim: true, maxlength: 220 },
    bodyTemplate: { type: String, required: true, trim: true, maxlength: 2000 },
    isDefault: { type: Boolean, default: false, required: true, index: true },
  },
  { timestamps: true },
);

reminderTemplateSchema.index({ userId: 1, createdAt: -1 });

export const ReminderTemplateModel = mongoose.model<IReminderTemplate>("ReminderTemplate", reminderTemplateSchema);

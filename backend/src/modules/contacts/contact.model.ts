import mongoose, { Document, Schema, Types } from "mongoose";

export const CONTACT_SOURCES = ["MANUAL", "DEVICE_CONTACT"] as const;
export type ContactSource = (typeof CONTACT_SOURCES)[number];

export interface IContact extends Document {
  userId: Types.ObjectId;
  name: string;
  phone?: string;
  email?: string;
  note?: string;
  source: ContactSource;
  deviceContactId?: string;
  normalizedPhone?: string;
  isFavorite: boolean;
  lastUsedAt?: Date;
  avatarColor?: string;
  relationship?: {
    preferredReminderChannel?: "WHATSAPP" | "EMAIL" | "CALL" | "SMS" | "NONE";
    preferredReminderTone?: "POLITE" | "NORMAL" | "STRICT" | "FRIENDLY";
    preferredLanguage?: "ROMAN_URDU" | "ENGLISH" | "URDU_STYLE";
    usuallyPaysOnTime?: boolean;
    doNotRemindBeforeDueDate?: boolean;
    importantContact?: boolean;
    privateNote?: string;
    tags?: string[];
  };
  createdAt: Date;
  updatedAt: Date;
}

const contactSchema = new Schema<IContact>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 120,
    },
    note: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    source: {
      type: String,
      enum: CONTACT_SOURCES,
      default: "MANUAL",
      required: true,
      index: true,
    },
    deviceContactId: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    normalizedPhone: {
      type: String,
      trim: true,
      maxlength: 40,
      index: true,
    },
    isFavorite: {
      type: Boolean,
      default: false,
      required: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      index: true,
    },
    avatarColor: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    relationship: {
      preferredReminderChannel: {
        type: String,
        enum: ["WHATSAPP", "EMAIL", "CALL", "SMS", "NONE"],
        default: "WHATSAPP",
      },
      preferredReminderTone: {
        type: String,
        enum: ["POLITE", "NORMAL", "STRICT", "FRIENDLY"],
        default: "POLITE",
      },
      preferredLanguage: {
        type: String,
        enum: ["ROMAN_URDU", "ENGLISH", "URDU_STYLE"],
        default: "ROMAN_URDU",
      },
      usuallyPaysOnTime: {
        type: Boolean,
      },
      doNotRemindBeforeDueDate: {
        type: Boolean,
        default: false,
      },
      importantContact: {
        type: Boolean,
        default: false,
      },
      privateNote: {
        type: String,
        trim: true,
        maxlength: 1000,
      },
      tags: [{
        type: String,
        trim: true,
        maxlength: 40,
      }],
    },
  },
  { timestamps: true },
);

contactSchema.index({ userId: 1, name: 1 });
contactSchema.index({ userId: 1, normalizedPhone: 1 });
contactSchema.index({ userId: 1, deviceContactId: 1 });
contactSchema.index({ userId: 1, isFavorite: 1, lastUsedAt: -1 });

export const ContactModel = mongoose.model<IContact>("Contact", contactSchema);

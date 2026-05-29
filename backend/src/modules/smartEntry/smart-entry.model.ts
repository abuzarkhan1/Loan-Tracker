import mongoose, { Document, Schema, Types } from "mongoose";
import { SmartEntryIntent, SmartEntryLanguage } from "../../utils/smartEntryParser";

export const SMART_ENTRY_INPUT_TYPES = ["TEXT", "VOICE"] as const;
export const SMART_ENTRY_STATUSES = ["PARSED", "CONFIRMED", "CANCELLED", "FAILED"] as const;
export type SmartEntryInputType = (typeof SMART_ENTRY_INPUT_TYPES)[number];
export type SmartEntryStatus = (typeof SMART_ENTRY_STATUSES)[number];

export interface ISmartEntry extends Document {
  userId: Types.ObjectId;
  inputType: SmartEntryInputType;
  originalText: string;
  language: SmartEntryLanguage;
  intent: SmartEntryIntent;
  parsedData: Record<string, unknown>;
  confidence: number;
  missingFields: string[];
  status: SmartEntryStatus;
  createdEntityType?: string;
  createdEntityId?: Types.ObjectId;
  audioStored: false;
  transcriptSaved: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const smartEntrySchema = new Schema<ISmartEntry>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    inputType: { type: String, enum: SMART_ENTRY_INPUT_TYPES, required: true },
    originalText: { type: String, required: true, trim: true, maxlength: 800 },
    language: { type: String, enum: ["ROMAN_URDU", "ENGLISH", "MIXED"], required: true },
    intent: {
      type: String,
      enum: ["CREATE_LOAN", "ADD_PAYMENT", "CREATE_EXPENSE", "CREATE_INCOME", "CREATE_SALARY", "CREATE_BILL", "CREATE_PROMISE", "CREATE_RECURRING_TRANSACTION", "UNKNOWN"],
      required: true,
      index: true,
    },
    parsedData: { type: Schema.Types.Mixed, default: {} },
    confidence: { type: Number, required: true, min: 0, max: 1 },
    missingFields: [{ type: String, trim: true }],
    status: { type: String, enum: SMART_ENTRY_STATUSES, default: "PARSED", required: true, index: true },
    createdEntityType: { type: String, trim: true },
    createdEntityId: { type: Schema.Types.ObjectId },
    audioStored: { type: Boolean, default: false, required: true },
    transcriptSaved: { type: Boolean, default: true, required: true },
  },
  { timestamps: true },
);

smartEntrySchema.index({ userId: 1, createdAt: -1 });
smartEntrySchema.index({ userId: 1, status: 1 });

export const SmartEntryModel = mongoose.model<ISmartEntry>("SmartEntry", smartEntrySchema);

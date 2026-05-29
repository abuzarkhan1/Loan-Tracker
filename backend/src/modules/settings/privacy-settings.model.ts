import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPrivacySettings extends Document {
  userId: Types.ObjectId;
  privacyModeEnabled: boolean;
  hideAmountsByDefault: boolean;
  requireUnlockToReveal: boolean;
  blurInAppSwitcher: boolean;
  scope: "DASHBOARD_ONLY" | "EVERYWHERE";
  smartEntryEnabled: boolean;
  voiceEntryEnabled: boolean;
  saveSmartEntryHistory: boolean;
  saveVoiceTranscriptHistory: boolean;
  smartEntryLanguagePreference: "ROMAN_URDU" | "ENGLISH" | "MIXED";
  createdAt: Date;
  updatedAt: Date;
}

const privacySettingsSchema = new Schema<IPrivacySettings>(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    privacyModeEnabled: { type: Boolean, default: false, required: true },
    hideAmountsByDefault: { type: Boolean, default: false, required: true },
    requireUnlockToReveal: { type: Boolean, default: false, required: true },
    blurInAppSwitcher: { type: Boolean, default: false, required: true },
    scope: { type: String, enum: ["DASHBOARD_ONLY", "EVERYWHERE"], default: "EVERYWHERE", required: true },
    smartEntryEnabled: { type: Boolean, default: true, required: true },
    voiceEntryEnabled: { type: Boolean, default: true, required: true },
    saveSmartEntryHistory: { type: Boolean, default: true, required: true },
    saveVoiceTranscriptHistory: { type: Boolean, default: false, required: true },
    smartEntryLanguagePreference: { type: String, enum: ["ROMAN_URDU", "ENGLISH", "MIXED"], default: "MIXED", required: true },
  },
  { timestamps: true },
);

export const PrivacySettingsModel = mongoose.model<IPrivacySettings>("PrivacySettings", privacySettingsSchema);

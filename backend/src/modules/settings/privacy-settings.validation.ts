import { z } from "zod";

export const updatePrivacySettingsSchema = z.object({
  body: z.object({
    privacyModeEnabled: z.boolean().optional(),
    hideAmountsByDefault: z.boolean().optional(),
    requireUnlockToReveal: z.boolean().optional(),
    blurInAppSwitcher: z.boolean().optional(),
    scope: z.enum(["DASHBOARD_ONLY", "EVERYWHERE"]).optional(),
    smartEntryEnabled: z.boolean().optional(),
    voiceEntryEnabled: z.boolean().optional(),
    saveSmartEntryHistory: z.boolean().optional(),
    saveVoiceTranscriptHistory: z.boolean().optional(),
    smartEntryLanguagePreference: z.enum(["ROMAN_URDU", "ENGLISH", "MIXED"]).optional(),
  }),
});

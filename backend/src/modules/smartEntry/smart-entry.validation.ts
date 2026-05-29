import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const parseSmartEntrySchema = z.object({
  body: z.object({
    inputType: z.enum(["TEXT", "VOICE"]),
    text: z.string().trim().min(2).max(800),
    language: z.enum(["ROMAN_URDU", "ENGLISH", "MIXED"]).optional(),
    saveTranscript: z.boolean().optional(),
  }),
});

export const confirmSmartEntrySchema = z.object({
  body: z.object({
    parseId: objectIdSchema,
    parsedData: z.record(z.string(), z.unknown()).optional(),
  }),
});

export const smartEntryIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });

export const smartEntryHistorySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

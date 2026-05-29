import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const backupIdParamSchema = z.object({
  params: z.object({
    backupId: objectIdSchema,
  }),
});

export const backupListSchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const restoreBackupSchema = z.object({
  params: z.object({
    backupId: objectIdSchema,
  }),
  body: z.object({
    mode: z.enum(["MERGE", "REPLACE"]).default("MERGE"),
  }),
});

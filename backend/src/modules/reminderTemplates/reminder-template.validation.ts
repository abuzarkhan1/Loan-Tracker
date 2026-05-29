import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";
import { TEMPLATE_CHANNELS, TEMPLATE_LANGUAGES, TEMPLATE_TONES, TEMPLATE_TYPES } from "./reminder-template.model";

const body = z.object({
  name: z.string().trim().min(2).max(120),
  type: z.enum(TEMPLATE_TYPES),
  channel: z.enum(TEMPLATE_CHANNELS),
  language: z.enum(TEMPLATE_LANGUAGES),
  tone: z.enum(TEMPLATE_TONES),
  subjectTemplate: z.string().trim().max(220).optional().or(z.literal("")),
  bodyTemplate: z.string().trim().min(2).max(2000),
  isDefault: z.boolean().optional(),
});

export const createReminderTemplateSchema = z.object({ body });
export const updateReminderTemplateSchema = z.object({ params: z.object({ id: objectIdSchema }), body: body.partial() });
export const reminderTemplateIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });
export const reminderTemplateListSchema = z.object({
  query: z.object({
    channel: z.enum(TEMPLATE_CHANNELS).optional(),
    type: z.enum(TEMPLATE_TYPES).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
  }),
});
export const reminderTemplatePreviewSchema = z.object({
  body: z.object({
    templateId: objectIdSchema.optional(),
    loanId: objectIdSchema,
    subjectTemplate: z.string().trim().max(220).optional(),
    bodyTemplate: z.string().trim().max(2000).optional(),
  }),
});

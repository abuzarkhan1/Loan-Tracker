import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const contactBodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().toLowerCase().optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
});

const deviceContactBodySchema = z.object({
  deviceContactId: z.string().trim().max(120).optional(),
  name: z.string().trim().min(1).max(100),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  emails: z.array(z.string().trim().email().toLowerCase()).default([]),
  source: z.enum(["DEVICE_CONTACT"]).optional(),
});

export const createContactSchema = z.object({
  body: contactBodySchema,
});

export const getContactsSchema = z.object({
  query: z.object({
    search: z.string().trim().optional(),
    sortBy: z.enum(["name", "createdAt", "updatedAt"]).default("name"),
    sortOrder: z.enum(["asc", "desc"]).default("asc"),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(10),
  }),
});

export const importDeviceContactSchema = z.object({
  body: deviceContactBodySchema,
});

export const bulkImportDeviceContactsSchema = z.object({
  body: z.object({
    contacts: z.array(deviceContactBodySchema).min(1).max(500),
  }),
});

export const matchContactSchema = z.object({
  query: z.object({
    phone: z.string().trim().max(40).optional(),
    name: z.string().trim().max(100).optional(),
    deviceContactId: z.string().trim().max(120).optional(),
  }),
});

export const favoriteContactSchema = z.object({
  params: z.object({
    contactId: objectIdSchema,
  }),
  body: z.object({
    isFavorite: z.boolean(),
  }),
});

export const relationshipSchema = z.object({
  params: z.object({
    contactId: objectIdSchema,
  }),
  body: z.object({
    preferredReminderChannel: z.enum(["WHATSAPP", "EMAIL", "CALL", "SMS", "NONE"]).optional(),
    preferredReminderTone: z.enum(["POLITE", "NORMAL", "STRICT", "FRIENDLY"]).optional(),
    preferredLanguage: z.enum(["ROMAN_URDU", "ENGLISH", "URDU_STYLE"]).optional(),
    usuallyPaysOnTime: z.boolean().optional(),
    doNotRemindBeforeDueDate: z.boolean().optional(),
    importantContact: z.boolean().optional(),
    privateNote: z.string().trim().max(1000).optional().or(z.literal("")),
    tags: z.array(z.string().trim().min(1).max(40)).max(20).optional(),
  }),
});

export const contactLimitSchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});

export const contactIdParamSchema = z.object({
  params: z.object({
    contactId: objectIdSchema,
  }),
});

export const updateContactSchema = z.object({
  params: z.object({
    contactId: objectIdSchema,
  }),
  body: contactBodySchema.partial(),
});

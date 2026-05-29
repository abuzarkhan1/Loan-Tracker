import { z } from "zod";

export const objectIdSchema = z.string().regex(/^[0-9a-fA-F]{24}$/, "Invalid id");

const contactBodySchema = z.object({
  name: z.string().trim().min(2).max(100),
  phone: z.string().trim().max(30).optional().or(z.literal("")),
  email: z.string().trim().email().toLowerCase().optional().or(z.literal("")),
  note: z.string().trim().max(500).optional().or(z.literal("")),
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

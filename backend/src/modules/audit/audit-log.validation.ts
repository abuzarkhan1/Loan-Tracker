import { z } from "zod";
import { AUDIT_ACTIONS, AUDIT_ENTITY_TYPES } from "./audit-log.model";

const positiveIntString = (fallback: number) =>
  z.preprocess((value) => value ?? fallback, z.coerce.number().int().positive());

export const getAuditLogsSchema = z.object({
  query: z.object({
    action: z.enum(AUDIT_ACTIONS).optional(),
    entityType: z.enum(AUDIT_ENTITY_TYPES).optional(),
    dateFrom: z.coerce.date().optional(),
    dateTo: z.coerce.date().optional(),
    page: positiveIntString(1).default(1),
    limit: positiveIntString(20).default(20),
  }),
});

export const auditLogIdParamSchema = z.object({
  params: z.object({
    auditLogId: z.string().regex(/^[a-f\d]{24}$/i, "Invalid audit log id"),
  }),
});

import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";
import { ALERT_STATUSES, ALERT_TYPES } from "./alert.model";

export const alertListSchema = z.object({
  query: z.object({
    status: z.enum(ALERT_STATUSES).optional(),
    type: z.enum(ALERT_TYPES).optional(),
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const alertIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });

import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const simulateScenarioSchema = z.object({
  body: z.object({
    type: z.enum(["PURCHASE", "REDUCE_EXPENSE", "EXTRA_LOAN_PAYMENT", "SALARY_DELAY", "EXTRA_SAVING", "CUSTOM"]),
    amount: z.coerce.number().positive(),
    note: z.string().trim().max(500).optional(),
    save: z.boolean().optional(),
  }),
});

export const scenarioIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });

import { z } from "zod";

export const assistantAskSchema = z.object({
  body: z.object({
    question: z.string().trim().min(2).max(500),
  }),
});

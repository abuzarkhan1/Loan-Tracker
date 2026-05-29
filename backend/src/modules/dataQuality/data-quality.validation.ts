import { z } from "zod";

export const dataQualityIssueIdSchema = z.object({ params: z.object({ id: z.string().trim().min(1).max(120) }) });

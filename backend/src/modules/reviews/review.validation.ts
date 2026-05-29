import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const reviewIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });

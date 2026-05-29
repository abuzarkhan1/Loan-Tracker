import { z } from "zod";
import { objectIdSchema } from "../contacts/contact.validation";

export const goalIdSchema = z.object({ params: z.object({ id: objectIdSchema }) });

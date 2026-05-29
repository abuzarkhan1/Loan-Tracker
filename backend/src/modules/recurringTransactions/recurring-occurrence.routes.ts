import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { markRecurringOccurrenceCompleted, skipRecurringOccurrence } from "./recurring-transaction.controller";
import { markRecurringCompletedSchema, recurringOccurrenceIdSchema } from "./recurring-transaction.validation";

const router = Router();

router.use(requireAuth);
router.patch("/:id/mark-completed", validateRequest(markRecurringCompletedSchema), markRecurringOccurrenceCompleted);
router.patch("/:id/skip", validateRequest(recurringOccurrenceIdSchema), skipRecurringOccurrence);

export default router;

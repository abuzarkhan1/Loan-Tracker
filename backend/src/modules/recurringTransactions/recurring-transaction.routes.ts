import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createRecurringTransaction,
  deleteRecurringTransaction,
  getRecurringOccurrences,
  getRecurringTransaction,
  getRecurringTransactions,
  getUpcomingRecurringTransactions,
  markRecurringOccurrenceCompleted,
  pauseRecurringTransaction,
  resumeRecurringTransaction,
  skipRecurringOccurrence,
  updateRecurringTransaction,
} from "./recurring-transaction.controller";
import {
  createRecurringTransactionSchema,
  markRecurringCompletedSchema,
  recurringIdSchema,
  recurringListSchema,
  recurringOccurrenceIdSchema,
  recurringOccurrenceListSchema,
  updateRecurringTransactionSchema,
} from "./recurring-transaction.validation";

const router = Router();

router.use(requireAuth);
router.get("/upcoming", getUpcomingRecurringTransactions);
router.get("/", validateRequest(recurringListSchema), getRecurringTransactions);
router.post("/", validateRequest(createRecurringTransactionSchema), createRecurringTransaction);
router.get("/:id", validateRequest(recurringIdSchema), getRecurringTransaction);
router.patch("/:id", validateRequest(updateRecurringTransactionSchema), updateRecurringTransaction);
router.delete("/:id", validateRequest(recurringIdSchema), deleteRecurringTransaction);
router.patch("/:id/pause", validateRequest(recurringIdSchema), pauseRecurringTransaction);
router.patch("/:id/resume", validateRequest(recurringIdSchema), resumeRecurringTransaction);
router.get("/:id/occurrences", validateRequest(recurringOccurrenceListSchema), getRecurringOccurrences);
router.patch("/occurrences/:id/mark-completed", validateRequest(markRecurringCompletedSchema), markRecurringOccurrenceCompleted);
router.patch("/occurrences/:id/skip", validateRequest(recurringOccurrenceIdSchema), skipRecurringOccurrence);

export default router;

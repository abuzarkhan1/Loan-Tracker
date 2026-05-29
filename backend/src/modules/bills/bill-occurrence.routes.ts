import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { markBillOccurrencePaid, skipBillOccurrence } from "./bill.controller";
import { markBillPaidSchema, occurrenceIdSchema } from "./bill.validation";

const router = Router();

router.use(requireAuth);
router.patch("/:id/mark-paid", validateRequest(markBillPaidSchema), markBillOccurrencePaid);
router.patch("/:id/skip", validateRequest(occurrenceIdSchema), skipBillOccurrence);

export default router;

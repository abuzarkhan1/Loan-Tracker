import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createBill,
  deleteBill,
  generateBillOccurrence,
  getBill,
  getBillOccurrences,
  getBills,
  getOverdueBills,
  getUpcomingBills,
  markBillOccurrencePaid,
  pauseBill,
  resumeBill,
  skipBillOccurrence,
  updateBill,
} from "./bill.controller";
import { billIdSchema, billListSchema, createBillSchema, markBillPaidSchema, occurrenceIdSchema, occurrenceListSchema, updateBillSchema } from "./bill.validation";

const router = Router();

router.use(requireAuth);
router.get("/upcoming", getUpcomingBills);
router.get("/overdue", getOverdueBills);
router.get("/", validateRequest(billListSchema), getBills);
router.post("/", validateRequest(createBillSchema), createBill);
router.get("/:id", validateRequest(billIdSchema), getBill);
router.patch("/:id", validateRequest(updateBillSchema), updateBill);
router.delete("/:id", validateRequest(billIdSchema), deleteBill);
router.patch("/:id/pause", validateRequest(billIdSchema), pauseBill);
router.patch("/:id/resume", validateRequest(billIdSchema), resumeBill);
router.post("/:id/occurrences/generate", validateRequest(billIdSchema), generateBillOccurrence);
router.get("/:id/occurrences", validateRequest(occurrenceListSchema), getBillOccurrences);
router.patch("/occurrences/:id/mark-paid", validateRequest(markBillPaidSchema), markBillOccurrencePaid);
router.patch("/occurrences/:id/skip", validateRequest(occurrenceIdSchema), skipBillOccurrence);

export default router;

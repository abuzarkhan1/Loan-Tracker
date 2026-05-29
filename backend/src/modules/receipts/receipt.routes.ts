import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createContactReceipt,
  createLoanReceipt,
  createPaymentReceipt,
  deleteReceipt,
  getReceipt,
  getReceipts,
} from "./receipt.controller";
import {
  receiptContactParamSchema,
  receiptIdParamSchema,
  receiptListSchema,
  receiptLoanParamSchema,
  receiptPaymentParamSchema,
} from "./receipt.validation";

const router = Router();

router.use(requireAuth);
router.post("/payment/:paymentId", validateRequest(receiptPaymentParamSchema), createPaymentReceipt);
router.post("/loan/:loanId", validateRequest(receiptLoanParamSchema), createLoanReceipt);
router.post("/contact/:contactId", validateRequest(receiptContactParamSchema), createContactReceipt);
router.get("/", validateRequest(receiptListSchema), getReceipts);
router.get("/:receiptId", validateRequest(receiptIdParamSchema), getReceipt);
router.delete("/:receiptId", validateRequest(receiptIdParamSchema), deleteReceipt);

export default router;

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { addPayment, deletePayment, getPaymentsByLoan, updatePayment } from "./payment.controller";
import {
  createPaymentSchema,
  loanPaymentsParamSchema,
  paymentIdParamSchema,
  updatePaymentSchema,
} from "./payment.validation";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createPaymentSchema), addPayment);
router.get("/loan/:loanId", validateRequest(loanPaymentsParamSchema), getPaymentsByLoan);
router.patch("/:paymentId", validateRequest(updatePaymentSchema), updatePayment);
router.delete("/:paymentId", validateRequest(paymentIdParamSchema), deletePayment);

export default router;

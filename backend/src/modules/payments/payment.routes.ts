import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { addPayment, deletePayment, getPayments, getPaymentsByLoan, updatePayment } from "./payment.controller";
import { addPaymentProof, deletePaymentProof, getPaymentProof } from "./proofs/payment-proof.controller";
import { paymentProofUpload } from "./proofs/payment-proof.upload";
import {
  createPaymentSchema,
  getPaymentsSchema,
  loanPaymentsParamSchema,
  paymentIdParamSchema,
  updatePaymentSchema,
} from "./payment.validation";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createPaymentSchema), addPayment);
router.get("/", validateRequest(getPaymentsSchema), getPayments);
router.get("/loan/:loanId", validateRequest(loanPaymentsParamSchema), getPaymentsByLoan);
router.post("/:paymentId/proof", validateRequest(paymentIdParamSchema), paymentProofUpload.single("proof"), addPaymentProof);
router.get("/:paymentId/proof", validateRequest(paymentIdParamSchema), getPaymentProof);
router.delete("/:paymentId/proof", validateRequest(paymentIdParamSchema), deletePaymentProof);
router.patch("/:paymentId", validateRequest(updatePaymentSchema), updatePayment);
router.delete("/:paymentId", validateRequest(paymentIdParamSchema), deletePayment);

export default router;

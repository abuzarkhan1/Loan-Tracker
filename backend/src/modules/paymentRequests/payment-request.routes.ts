import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  cancelPaymentRequest,
  createPaymentRequest,
  getPaymentRequest,
  getPaymentRequests,
  markPaymentRequestShared,
} from "./payment-request.controller";
import { createPaymentRequestSchema, paymentRequestIdSchema, paymentRequestListSchema } from "./payment-request.validation";

const router = Router();

router.use(requireAuth);
router.post("/loan/:loanId", validateRequest(createPaymentRequestSchema), createPaymentRequest);
router.get("/", validateRequest(paymentRequestListSchema), getPaymentRequests);
router.get("/:id", validateRequest(paymentRequestIdSchema), getPaymentRequest);
router.patch("/:id/cancel", validateRequest(paymentRequestIdSchema), cancelPaymentRequest);
router.patch("/:id/mark-shared", validateRequest(paymentRequestIdSchema), markPaymentRequestShared);

export default router;

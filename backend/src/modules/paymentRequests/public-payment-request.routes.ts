import { Router } from "express";
import { validateRequest } from "../../middleware/validateRequest";
import { getPublicPaymentRequest } from "./payment-request.controller";
import { publicPaymentRequestSchema } from "./payment-request.validation";

const router = Router();

router.get("/payment-request/:token", validateRequest(publicPaymentRequestSchema), getPublicPaymentRequest);

export default router;

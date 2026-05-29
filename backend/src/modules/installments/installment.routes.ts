import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  getUpcomingInstallments,
  payInstallment,
  updateInstallment,
} from "./installment.controller";
import { installmentIdParamSchema, payInstallmentSchema, updateInstallmentSchema } from "./installment.validation";

const router = Router();

router.use(requireAuth);
router.get("/upcoming", getUpcomingInstallments);
router.patch("/:installmentId", validateRequest(updateInstallmentSchema), updateInstallment);
router.post("/:installmentId/pay", validateRequest(payInstallmentSchema), payInstallment);
router.get("/:installmentId", validateRequest(installmentIdParamSchema), (_req, res) => {
  res.status(405).json({ success: false, message: "Use loan installment list endpoint", data: null });
});

export default router;

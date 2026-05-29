import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  cancelSettlement,
  createSettlement,
  getLoanSettlement,
  getSettlement,
  getSettlements,
  sendSettlementEmail,
} from "./settlement.controller";
import { createSettlementSchema, settlementIdSchema, settlementListSchema, settlementLoanParamSchema } from "./settlement.validation";

const router = Router();

router.use(requireAuth);
router.post("/loan/:loanId", validateRequest(createSettlementSchema), createSettlement);
router.get("/", validateRequest(settlementListSchema), getSettlements);
router.get("/loan/:loanId", validateRequest(settlementLoanParamSchema), getLoanSettlement);
router.get("/:id", validateRequest(settlementIdSchema), getSettlement);
router.patch("/:id/cancel", validateRequest(settlementIdSchema), cancelSettlement);
router.post("/:id/send-email", validateRequest(settlementIdSchema), sendSettlementEmail);

export default router;

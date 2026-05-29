import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  getCashFlow,
  getCategoryBreakdown,
  getFinanceDashboard,
  getFinanceInsights,
  getFinanceMonthlyReport,
  getFinancePaymentMethodBreakdown,
} from "./finance.controller";
import { financeDateRangeSchema } from "./finance.validation";

const router = Router();

router.use(requireAuth);
router.get("/dashboard", validateRequest(financeDateRangeSchema), getFinanceDashboard);
router.get("/cash-flow", validateRequest(financeDateRangeSchema), getCashFlow);
router.get("/category-breakdown", validateRequest(financeDateRangeSchema), getCategoryBreakdown);
router.get("/payment-method-breakdown", validateRequest(financeDateRangeSchema), getFinancePaymentMethodBreakdown);
router.get("/monthly-report", validateRequest(financeDateRangeSchema), getFinanceMonthlyReport);
router.get("/insights", validateRequest(financeDateRangeSchema), getFinanceInsights);

export default router;

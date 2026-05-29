import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import {
  getLoanStatusChart,
  getLoanTypeChart,
  getInsights,
  getMonthlyChart,
  getSummary,
  getTopContacts,
} from "./dashboard.controller";

const router = Router();

router.use(requireAuth);
router.get("/summary", getSummary);
router.get("/insights", getInsights);
router.get("/monthly-chart", getMonthlyChart);
router.get("/loan-type-chart", getLoanTypeChart);
router.get("/loan-status-chart", getLoanStatusChart);
router.get("/top-contacts", getTopContacts);

export default router;

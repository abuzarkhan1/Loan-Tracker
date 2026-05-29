import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  contactReportParamSchema,
  monthlyReportSchema,
  reportIdParamSchema,
  reportListSchema,
} from "./report.validation";
import {
  createCompleteHistoryPdf,
  createContactExcel,
  createContactPdf,
  createLoansExcel,
  createMonthlyPdf,
  createPaymentsExcel,
  deleteReport,
  getBudgetUsageReport,
  getCashFlowTrendReport,
  getContactPerformanceReport,
  getLoanImpactOnSalaryReport,
  getMonthlySummaryReport,
  getOverdueReport,
  getPaymentMethodsReport,
  getReport,
  getRecoveryRateReport,
  getReportsOverview,
  getReports,
  getSalaryVsExpenseReport,
  getSavingsProgressReport,
} from "./report.controller";

const router = Router();

router.use(requireAuth);
router.post("/pdf/contact/:contactId", validateRequest(contactReportParamSchema), createContactPdf);
router.post("/pdf/monthly", validateRequest(monthlyReportSchema), createMonthlyPdf);
router.post("/pdf/complete-history", createCompleteHistoryPdf);
router.post("/excel/loans", createLoansExcel);
router.post("/excel/payments", createPaymentsExcel);
router.post("/excel/contact/:contactId", validateRequest(contactReportParamSchema), createContactExcel);
router.get("/overview", getReportsOverview);
router.get("/monthly-summary", getMonthlySummaryReport);
router.get("/overdue", getOverdueReport);
router.get("/payment-methods", getPaymentMethodsReport);
router.get("/recovery-rate", getRecoveryRateReport);
router.get("/contact-performance", getContactPerformanceReport);
router.get("/salary-vs-expense", getSalaryVsExpenseReport);
router.get("/loan-impact-on-salary", getLoanImpactOnSalaryReport);
router.get("/budget-usage", getBudgetUsageReport);
router.get("/savings-progress", getSavingsProgressReport);
router.get("/cash-flow-trend", getCashFlowTrendReport);
router.get("/", validateRequest(reportListSchema), getReports);
router.get("/:reportId", validateRequest(reportIdParamSchema), getReport);
router.delete("/:reportId", validateRequest(reportIdParamSchema), deleteReport);

export default router;

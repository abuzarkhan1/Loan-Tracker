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
  getReport,
  getReports,
} from "./report.controller";

const router = Router();

router.use(requireAuth);
router.post("/pdf/contact/:contactId", validateRequest(contactReportParamSchema), createContactPdf);
router.post("/pdf/monthly", validateRequest(monthlyReportSchema), createMonthlyPdf);
router.post("/pdf/complete-history", createCompleteHistoryPdf);
router.post("/excel/loans", createLoansExcel);
router.post("/excel/payments", createPaymentsExcel);
router.post("/excel/contact/:contactId", validateRequest(contactReportParamSchema), createContactExcel);
router.get("/", validateRequest(reportListSchema), getReports);
router.get("/:reportId", validateRequest(reportIdParamSchema), getReport);
router.delete("/:reportId", validateRequest(reportIdParamSchema), deleteReport);

export default router;

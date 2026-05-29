import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  emailLogsSchema,
  retryEmailSchema,
  sendContactEmailSchema,
  sendLoanEmailSchema,
  sendMonthlyReportEmailSchema,
  sendPaymentReceiptEmailSchema,
  updateEmailPreferencesSchema,
} from "./email.validation";
import {
  getEmailLogs,
  getEmailPreferences,
  retryEmail,
  sendContactStatementEmail,
  sendLoanSummaryEmail,
  sendMonthlyReportEmail,
  sendOverdueReminderEmail,
  sendPaymentReceiptEmail,
  sendPaymentRequestEmail,
  sendSettlementConfirmationEmail,
  updateEmailPreferences,
} from "./email.controller";

const router = Router();

router.use(requireAuth);
router.get("/preferences", getEmailPreferences);
router.patch("/preferences", validateRequest(updateEmailPreferencesSchema), updateEmailPreferences);
router.post("/send-payment-receipt/:paymentId", validateRequest(sendPaymentReceiptEmailSchema), sendPaymentReceiptEmail);
router.post("/send-loan-summary/:loanId", validateRequest(sendLoanEmailSchema), sendLoanSummaryEmail);
router.post("/send-contact-statement/:contactId", validateRequest(sendContactEmailSchema), sendContactStatementEmail);
router.post("/send-monthly-report", validateRequest(sendMonthlyReportEmailSchema), sendMonthlyReportEmail);
router.post("/send-overdue-reminder/:loanId", validateRequest(sendLoanEmailSchema), sendOverdueReminderEmail);
router.post("/send-payment-request/:loanId", validateRequest(sendLoanEmailSchema), sendPaymentRequestEmail);
router.post("/send-settlement-confirmation/:loanId", validateRequest(sendLoanEmailSchema), sendSettlementConfirmationEmail);
router.get("/logs", validateRequest(emailLogsSchema), getEmailLogs);
router.post("/logs/:id/retry", validateRequest(retryEmailSchema), retryEmail);

export default router;

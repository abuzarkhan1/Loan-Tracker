import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { generateLoanInstallments, getLoanInstallments } from "../installments/installment.controller";
import { loanInstallmentsParamSchema } from "../installments/installment.validation";
import {
  getLoanReminder,
  previewLoanReminderMessage,
  snoozeLoanReminder,
  testLoanReminderMessage,
  updateLoanReminder,
} from "../reminders/reminder.controller";
import {
  loanReminderParamSchema,
  snoozeLoanReminderSchema,
  updateLoanReminderSchema,
} from "../reminders/reminder.validation";
import {
  createLoan,
  deleteLoan,
  getLoanDetail,
  getLoanInterestPreview,
  getLoans,
  getPinnedLoans,
  setPinnedLoan,
  updateLoan,
  updateLoanInterest,
} from "./loan.controller";
import {
  createLoanSchema,
  getLoansSchema,
  loanIdParamSchema,
  pinLoanSchema,
  pinnedLoansSchema,
  updateLoanInterestSchema,
  updateLoanSchema,
} from "./loan.validation";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createLoanSchema), createLoan);
router.get("/", validateRequest(getLoansSchema), getLoans);
router.get("/pinned", validateRequest(pinnedLoansSchema), getPinnedLoans);
router.patch("/:loanId/pin", validateRequest(pinLoanSchema), setPinnedLoan);
router.post("/:loanId/installments/generate", validateRequest(loanInstallmentsParamSchema), generateLoanInstallments);
router.get("/:loanId/installments", validateRequest(loanInstallmentsParamSchema), getLoanInstallments);
router.get("/:loanId/reminder", validateRequest(loanReminderParamSchema), getLoanReminder);
router.patch("/:loanId/reminder", validateRequest(updateLoanReminderSchema), updateLoanReminder);
router.post("/:loanId/reminder/snooze", validateRequest(snoozeLoanReminderSchema), snoozeLoanReminder);
router.post("/:loanId/reminder/test-message", validateRequest(loanReminderParamSchema), testLoanReminderMessage);
router.get("/:loanId/reminder/preview", validateRequest(loanReminderParamSchema), previewLoanReminderMessage);
router.get("/:loanId/interest-preview", validateRequest(loanIdParamSchema), getLoanInterestPreview);
router.patch("/:loanId/interest", validateRequest(updateLoanInterestSchema), updateLoanInterest);
router.get("/:loanId", validateRequest(loanIdParamSchema), getLoanDetail);
router.patch("/:loanId", validateRequest(updateLoanSchema), updateLoan);
router.delete("/:loanId", validateRequest(loanIdParamSchema), deleteLoan);

export default router;

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { generateLoanInstallments, getLoanInstallments } from "../installments/installment.controller";
import { loanInstallmentsParamSchema } from "../installments/installment.validation";
import {
  createLoan,
  deleteLoan,
  getLoanDetail,
  getLoanInterestPreview,
  getLoans,
  updateLoan,
  updateLoanInterest,
} from "./loan.controller";
import {
  createLoanSchema,
  getLoansSchema,
  loanIdParamSchema,
  updateLoanInterestSchema,
  updateLoanSchema,
} from "./loan.validation";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createLoanSchema), createLoan);
router.get("/", validateRequest(getLoansSchema), getLoans);
router.post("/:loanId/installments/generate", validateRequest(loanInstallmentsParamSchema), generateLoanInstallments);
router.get("/:loanId/installments", validateRequest(loanInstallmentsParamSchema), getLoanInstallments);
router.get("/:loanId/interest-preview", validateRequest(loanIdParamSchema), getLoanInterestPreview);
router.patch("/:loanId/interest", validateRequest(updateLoanInterestSchema), updateLoanInterest);
router.get("/:loanId", validateRequest(loanIdParamSchema), getLoanDetail);
router.patch("/:loanId", validateRequest(updateLoanSchema), updateLoan);
router.delete("/:loanId", validateRequest(loanIdParamSchema), deleteLoan);

export default router;

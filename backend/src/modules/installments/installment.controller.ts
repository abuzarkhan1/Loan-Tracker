import { cacheInvalidation } from "../../cache/cache.invalidation";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { installmentService } from "./installment.service";

export const generateLoanInstallments = asyncHandler(async (req, res) => {
  const data = await installmentService.generateInstallments(req.user!.id, String(req.params.loanId));
  await cacheInvalidation.loanChanged(req.user!.id, { loanId: String(req.params.loanId) });
  return sendResponse(res, 201, "Installments generated successfully", data);
});

export const getLoanInstallments = asyncHandler(async (req, res) => {
  const data = await installmentService.getLoanInstallments(req.user!.id, String(req.params.loanId));
  return sendResponse(res, 200, "Installments fetched successfully", data);
});

export const updateInstallment = asyncHandler(async (req, res) => {
  const data = await installmentService.updateInstallment(req.user!.id, String(req.params.installmentId), req.body);
  await cacheInvalidation.loanChanged(req.user!.id, { loanId: data.loanId.toString() });
  return sendResponse(res, 200, "Installment updated successfully", data);
});

export const payInstallment = asyncHandler(async (req, res) => {
  const data = await installmentService.payInstallment(req.user!.id, String(req.params.installmentId), req.body);
  await cacheInvalidation.paymentChanged(req.user!.id, {
    loanId: data.loan._id.toString(),
    contactId: data.loan.contactId.toString(),
  });
  return sendResponse(res, 201, "Installment payment added successfully", data);
});

export const getUpcomingInstallments = asyncHandler(async (req, res) => {
  const data = await installmentService.getUpcoming(req.user!.id);
  return sendResponse(res, 200, "Upcoming installments fetched successfully", data);
});

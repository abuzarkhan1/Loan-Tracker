import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { loanService } from "./loan.service";

export const createLoan = asyncHandler(async (req, res) => {
  const data = await loanService.createLoan(req.user!.id, req.body);
  return sendResponse(res, 201, "Loan created successfully", data);
});

export const getLoans = asyncHandler(async (req, res) => {
  const data = await loanService.getLoans(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Loans fetched successfully", data);
});

export const getLoanDetail = asyncHandler(async (req, res) => {
  const data = await loanService.getLoanDetail(req.user!.id, String(req.params.loanId));
  return sendResponse(res, 200, "Loan detail fetched successfully", data);
});

export const updateLoan = asyncHandler(async (req, res) => {
  const data = await loanService.updateLoan(req.user!.id, String(req.params.loanId), req.body);
  return sendResponse(res, 200, "Loan updated successfully", data);
});

export const deleteLoan = asyncHandler(async (req, res) => {
  const data = await loanService.deleteLoan(req.user!.id, String(req.params.loanId));
  return sendResponse(res, 200, "Loan deleted successfully", data);
});

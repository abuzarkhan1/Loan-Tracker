import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { paymentService } from "./payment.service";

export const addPayment = asyncHandler(async (req, res) => {
  const data = await paymentService.addPayment(req.user!.id, req.body);
  return sendResponse(res, 201, "Payment added successfully", data);
});

export const getPaymentsByLoan = asyncHandler(async (req, res) => {
  const data = await paymentService.getPaymentsByLoan(req.user!.id, String(req.params.loanId));
  return sendResponse(res, 200, "Payments fetched successfully", data);
});

export const updatePayment = asyncHandler(async (req, res) => {
  const data = await paymentService.updatePayment(req.user!.id, String(req.params.paymentId), req.body);
  return sendResponse(res, 200, "Payment updated successfully", data);
});

export const deletePayment = asyncHandler(async (req, res) => {
  const data = await paymentService.deletePayment(req.user!.id, String(req.params.paymentId));
  return sendResponse(res, 200, "Payment deleted successfully", data);
});

import { cacheInvalidation } from "../../cache/cache.invalidation";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { paymentRequestService } from "./payment-request.service";

const audit = async (req: Parameters<typeof getAuditRequestMeta>[0], action: "PAYMENT_REQUEST_CREATED" | "PAYMENT_REQUEST_SHARED" | "PAYMENT_REQUEST_CANCELLED", id: string, value: unknown) => {
  await auditLogService.record({ userId: req.user!.id, action, entityType: "PAYMENT_REQUEST", entityId: id, newValue: serializeAuditValue(value), ...getAuditRequestMeta(req) });
};

export const createPaymentRequest = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await paymentRequestService.createForLoan(userId, String(req.params.loanId), req.body);
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "PAYMENT_REQUEST_CREATED", data._id.toString(), data);
  return sendResponse(res, 201, "Payment request created successfully", data);
});

export const getPaymentRequests = asyncHandler(async (req, res) => {
  const data = await paymentRequestService.list(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Payment requests fetched successfully", data);
});

export const getPaymentRequest = asyncHandler(async (req, res) => {
  const data = await paymentRequestService.get(req.user!.id, String(req.params.id));
  return sendResponse(res, 200, "Payment request fetched successfully", data);
});

export const cancelPaymentRequest = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await paymentRequestService.cancel(userId, String(req.params.id));
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "PAYMENT_REQUEST_CANCELLED", data._id.toString(), data);
  return sendResponse(res, 200, "Payment request cancelled successfully", data);
});

export const markPaymentRequestShared = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await paymentRequestService.markShared(userId, String(req.params.id));
  await cacheInvalidation.communicationChanged(userId);
  await audit(req, "PAYMENT_REQUEST_SHARED", data._id.toString(), data);
  return sendResponse(res, 200, "Payment request marked shared successfully", data);
});

export const getPublicPaymentRequest = asyncHandler(async (req, res) => {
  const data = await paymentRequestService.getPublic(String(req.params.token));
  return sendResponse(res, 200, "Payment request fetched successfully", data);
});

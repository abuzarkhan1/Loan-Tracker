import { cacheInvalidation } from "../../cache/cache.invalidation";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { paymentService } from "./payment.service";

const getDocumentId = (value: unknown) => {
  if (value && typeof value === "object" && "_id" in value) {
    return String((value as { _id: unknown })._id);
  }

  return String(value);
};

export const addPayment = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await paymentService.addPayment(userId, req.body);
  const paymentId = data.payment._id.toString();
  await cacheInvalidation.paymentChanged(userId, {
    loanId: getDocumentId(data.payment.loanId),
    contactId: getDocumentId(data.payment.contactId),
  });
  await auditLogService.record({
    userId,
    action: "PAYMENT_CREATED",
    entityType: "PAYMENT",
    entityId: paymentId,
    newValue: serializeAuditValue(data.payment),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 201, "Payment added successfully", data);
});

export const getPaymentsByLoan = asyncHandler(async (req, res) => {
  const data = await paymentService.getPaymentsByLoan(req.user!.id, String(req.params.loanId));
  return sendResponse(res, 200, "Payments fetched successfully", data);
});

export const getPayments = asyncHandler(async (req, res) => {
  const data = await paymentService.getPayments(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Payments fetched successfully", data);
});

export const updatePayment = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const paymentId = String(req.params.paymentId);
  const data = await paymentService.updatePayment(userId, paymentId, req.body);
  await cacheInvalidation.paymentChanged(userId, {
    loanId: getDocumentId(data.payment.loanId),
    contactId: getDocumentId(data.payment.contactId),
  });
  await auditLogService.record({
    userId,
    action: "PAYMENT_UPDATED",
    entityType: "PAYMENT",
    entityId: paymentId,
    newValue: serializeAuditValue(data.payment),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Payment updated successfully", data);
});

export const deletePayment = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const paymentId = String(req.params.paymentId);
  const data = await paymentService.deletePayment(userId, paymentId);
  await cacheInvalidation.paymentChanged(userId, {
    loanId: getDocumentId(data.loan._id),
    contactId: getDocumentId(data.loan.contactId),
  });
  await auditLogService.record({
    userId,
    action: "PAYMENT_DELETED",
    entityType: "PAYMENT",
    entityId: paymentId,
    oldValue: { id: paymentId },
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Payment deleted successfully", data);
});

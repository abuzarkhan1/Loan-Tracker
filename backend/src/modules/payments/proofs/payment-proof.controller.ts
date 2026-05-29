import { cacheInvalidation } from "../../../cache/cache.invalidation";
import { auditLogService } from "../../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../../audit/audit-log.utils";
import { sendResponse } from "../../../utils/apiResponse";
import { asyncHandler } from "../../../utils/asyncHandler";
import { paymentProofService } from "./payment-proof.service";

export const addPaymentProof = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const paymentId = String(req.params.paymentId);
  const data = await paymentProofService.addProof(userId, paymentId, req.file);
  await cacheInvalidation.paymentChanged(userId, {
    loanId: data.loanId.toString(),
  });
  await auditLogService.record({
    userId,
    action: "PAYMENT_UPDATED",
    entityType: "PAYMENT",
    entityId: paymentId,
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 201, "Payment proof uploaded successfully", data);
});

export const getPaymentProof = asyncHandler(async (req, res) => {
  const data = await paymentProofService.getProof(req.user!.id, String(req.params.paymentId));
  return sendResponse(res, 200, "Payment proof fetched successfully", data);
});

export const deletePaymentProof = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const paymentId = String(req.params.paymentId);
  const data = await paymentProofService.deleteProof(userId, paymentId);
  await cacheInvalidation.paymentChanged(userId);
  await auditLogService.record({
    userId,
    action: "PAYMENT_UPDATED",
    entityType: "PAYMENT",
    entityId: paymentId,
    oldValue: data,
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Payment proof deleted successfully", data);
});

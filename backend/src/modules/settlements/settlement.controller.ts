import { cacheInvalidation } from "../../cache/cache.invalidation";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { emailService } from "../email/email.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { settlementService } from "./settlement.service";

export const createSettlement = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await settlementService.createForLoan(userId, String(req.params.loanId), req.body);
  await cacheInvalidation.communicationChanged(userId);
  await auditLogService.record({ userId, action: "SETTLEMENT_CREATED", entityType: "SETTLEMENT", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 201, "Settlement created successfully", data);
});

export const getSettlements = asyncHandler(async (req, res) => {
  const data = await settlementService.list(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Settlements fetched successfully", data);
});

export const getSettlement = asyncHandler(async (req, res) => {
  const data = await settlementService.get(req.user!.id, String(req.params.id));
  return sendResponse(res, 200, "Settlement fetched successfully", data);
});

export const getLoanSettlement = asyncHandler(async (req, res) => {
  const data = await settlementService.getByLoan(req.user!.id, String(req.params.loanId));
  return sendResponse(res, 200, "Loan settlement fetched successfully", data);
});

export const cancelSettlement = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await settlementService.cancel(userId, String(req.params.id));
  await cacheInvalidation.communicationChanged(userId);
  await auditLogService.record({ userId, action: "SETTLEMENT_CANCELLED", entityType: "SETTLEMENT", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Settlement cancelled successfully", data);
});

export const sendSettlementEmail = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const settlement = await settlementService.get(userId, String(req.params.id));
  const data = await emailService.sendSettlementConfirmation(userId, settlement.loanId.toString(), req.body || {});
  await cacheInvalidation.communicationChanged(userId);
  await auditLogService.record({ userId, action: "SETTLEMENT_EMAIL_SENT", entityType: "SETTLEMENT", entityId: settlement._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 202, "Settlement email queued successfully", data);
});

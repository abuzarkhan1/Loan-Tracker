import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { receiptService } from "./receipt.service";

export const createPaymentReceipt = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await receiptService.createPaymentReceipt(userId, String(req.params.paymentId));
  await cacheInvalidation.receiptChanged(userId);
  await auditLogService.record({
    userId,
    action: "RECEIPT_GENERATED",
    entityType: "RECEIPT",
    entityId: data?._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 202, "Payment receipt queued successfully", data);
});

export const createLoanReceipt = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await receiptService.createLoanReceipt(userId, String(req.params.loanId));
  await cacheInvalidation.receiptChanged(userId);
  await auditLogService.record({
    userId,
    action: "RECEIPT_GENERATED",
    entityType: "RECEIPT",
    entityId: data?._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 202, "Loan receipt queued successfully", data);
});

export const createContactReceipt = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await receiptService.createContactReceipt(userId, String(req.params.contactId));
  await cacheInvalidation.receiptChanged(userId);
  await auditLogService.record({
    userId,
    action: "RECEIPT_GENERATED",
    entityType: "RECEIPT",
    entityId: data?._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 202, "Contact receipt queued successfully", data);
});

export const getReceipts = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.receipts.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Receipts fetched successfully", cached);
  }

  const data = await receiptService.getReceipts(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Receipts fetched successfully", data);
});

export const getReceipt = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const receiptId = String(req.params.receiptId);
  const key = cacheKeys.receipts.detail(userId, receiptId);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Receipt fetched successfully", cached);
  }

  const data = await receiptService.getReceipt(userId, receiptId);
  await cacheService.set(key, data, cacheTtl.loanDetail);
  return sendResponse(res, 200, "Receipt fetched successfully", data);
});

export const deleteReceipt = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const receiptId = String(req.params.receiptId);
  const data = await receiptService.deleteReceipt(userId, receiptId);
  await cacheInvalidation.receiptChanged(userId);
  await auditLogService.record({
    userId,
    action: "RECEIPT_DELETED",
    entityType: "RECEIPT",
    entityId: receiptId,
    oldValue: data,
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Receipt deleted successfully", data);
});

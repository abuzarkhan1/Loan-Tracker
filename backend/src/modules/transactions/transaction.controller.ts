import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { transactionService } from "./transaction.service";

export const createTransaction = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await transactionService.create(userId, req.body);
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({
    userId,
    action: "TRANSACTION_CREATED",
    entityType: "TRANSACTION",
    entityId: data._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 201, "Transaction created successfully", data);
});

export const getTransactions = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.transactions.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Transactions fetched successfully", cached);
  const data = await transactionService.list(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Transactions fetched successfully", data);
});

export const getTransaction = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const id = String(req.params.id);
  const key = cacheKeys.transactions.detail(userId, id);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Transaction fetched successfully", cached);
  const data = await transactionService.get(userId, id);
  await cacheService.set(key, data, cacheTtl.loanDetail);
  return sendResponse(res, 200, "Transaction fetched successfully", data);
});

export const updateTransaction = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await transactionService.update(userId, String(req.params.id), req.body);
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({
    userId,
    action: "TRANSACTION_UPDATED",
    entityType: "TRANSACTION",
    entityId: data._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Transaction updated successfully", data);
});

export const deleteTransaction = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await transactionService.delete(userId, String(req.params.id));
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({
    userId,
    action: "TRANSACTION_DELETED",
    entityType: "TRANSACTION",
    entityId: String(req.params.id),
    oldValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Transaction deleted successfully", data);
});

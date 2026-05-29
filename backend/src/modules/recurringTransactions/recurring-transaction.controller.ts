import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { recurringTransactionService } from "./recurring-transaction.service";

const changed = async (userId: string) => cacheInvalidation.financeChanged(userId);

export const createRecurringTransaction = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await recurringTransactionService.create(userId, req.body);
  await changed(userId);
  await auditLogService.record({ userId, action: "RECURRING_TRANSACTION_CREATED", entityType: "RECURRING_TRANSACTION", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 201, "Recurring transaction created successfully", data);
});

export const getRecurringTransactions = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.recurringTransactions.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Recurring transactions fetched successfully", cached);
  const data = await recurringTransactionService.list(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Recurring transactions fetched successfully", data);
});

export const getRecurringTransaction = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await recurringTransactionService.get(userId, String(req.params.id));
  return sendResponse(res, 200, "Recurring transaction fetched successfully", data);
});

export const updateRecurringTransaction = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await recurringTransactionService.update(userId, String(req.params.id), req.body);
  await changed(userId);
  await auditLogService.record({ userId, action: "RECURRING_TRANSACTION_UPDATED", entityType: "RECURRING_TRANSACTION", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Recurring transaction updated successfully", data);
});

export const deleteRecurringTransaction = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await recurringTransactionService.delete(userId, String(req.params.id));
  await changed(userId);
  await auditLogService.record({ userId, action: "RECURRING_TRANSACTION_DELETED", entityType: "RECURRING_TRANSACTION", entityId: String(req.params.id), oldValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Recurring transaction deleted successfully", data);
});

export const pauseRecurringTransaction = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await recurringTransactionService.setStatus(userId, String(req.params.id), "PAUSED");
  await changed(userId);
  return sendResponse(res, 200, "Recurring transaction paused successfully", data);
});

export const resumeRecurringTransaction = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await recurringTransactionService.setStatus(userId, String(req.params.id), "ACTIVE");
  await changed(userId);
  return sendResponse(res, 200, "Recurring transaction resumed successfully", data);
});

export const getRecurringOccurrences = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await recurringTransactionService.occurrences(userId, String(req.params.id), req.query as never);
  return sendResponse(res, 200, "Recurring occurrences fetched successfully", data);
});

export const markRecurringOccurrenceCompleted = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await recurringTransactionService.markCompleted(userId, String(req.params.id), req.body);
  await changed(userId);
  await auditLogService.record({ userId, action: "RECURRING_OCCURRENCE_COMPLETED", entityType: "RECURRING_OCCURRENCE", entityId: String(req.params.id), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Recurring occurrence completed successfully", data);
});

export const skipRecurringOccurrence = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await recurringTransactionService.skip(userId, String(req.params.id));
  await changed(userId);
  return sendResponse(res, 200, "Recurring occurrence skipped successfully", data);
});

export const getUpcomingRecurringTransactions = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.recurringTransactions.upcoming(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Upcoming recurring transactions fetched successfully", cached);
  const data = await recurringTransactionService.upcoming(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.finance);
  return sendResponse(res, 200, "Upcoming recurring transactions fetched successfully", data);
});

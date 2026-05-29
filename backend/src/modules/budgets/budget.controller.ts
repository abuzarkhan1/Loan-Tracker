import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { budgetService } from "./budget.service";

export const createBudget = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await budgetService.create(userId, req.body);
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({ userId, action: "BUDGET_CREATED", entityType: "BUDGET", entityId: data?._id?.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 201, "Budget saved successfully", data);
});

export const getCurrentBudget = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.budgets.current(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Current budget fetched successfully", cached);
  const data = await budgetService.current(userId, req.query.date ? new Date(String(req.query.date)) : new Date());
  await cacheService.set(key, data, cacheTtl.budgets);
  return sendResponse(res, 200, "Current budget fetched successfully", data);
});

export const getBudgets = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.budgets.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Budgets fetched successfully", cached);
  const data = await budgetService.list(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.budgets);
  return sendResponse(res, 200, "Budgets fetched successfully", data);
});

export const getBudgetRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.budgets.recommendations(userId);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Budget recommendations fetched successfully", cached);
  const data = await budgetService.recommendations(userId);
  await cacheService.set(key, data, cacheTtl.reports);
  return sendResponse(res, 200, "Budget recommendations fetched successfully", data);
});

export const applyBudgetRecommendations = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await budgetService.applyRecommendations(userId, req.body.categoryIds);
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({ userId, action: "BUDGET_RECOMMENDATIONS_APPLIED", entityType: "BUDGET", entityId: data?._id?.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Budget recommendations applied successfully", data);
});

export const updateBudget = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await budgetService.update(userId, String(req.params.id), req.body);
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({ userId, action: "BUDGET_UPDATED", entityType: "BUDGET", entityId: String(req.params.id), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Budget updated successfully", data);
});

export const deleteBudget = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await budgetService.delete(userId, String(req.params.id));
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({ userId, action: "BUDGET_DELETED", entityType: "BUDGET", entityId: String(req.params.id), oldValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Budget deleted successfully", data);
});

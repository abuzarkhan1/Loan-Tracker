import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { savingsGoalService } from "./savings-goal.service";

export const createSavingsGoal = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await savingsGoalService.create(userId, req.body);
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({ userId, action: "SAVINGS_GOAL_CREATED", entityType: "SAVINGS_GOAL", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 201, "Savings goal created successfully", data);
});

export const getSavingsGoals = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.savingsGoals.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Savings goals fetched successfully", cached);
  const data = await savingsGoalService.list(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.savings);
  return sendResponse(res, 200, "Savings goals fetched successfully", data);
});

export const getSavingsGoal = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const id = String(req.params.id);
  const key = cacheKeys.savingsGoals.detail(userId, id);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Savings goal fetched successfully", cached);
  const data = await savingsGoalService.get(userId, id);
  await cacheService.set(key, data, cacheTtl.savings);
  return sendResponse(res, 200, "Savings goal fetched successfully", data);
});

export const updateSavingsGoal = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await savingsGoalService.update(userId, String(req.params.id), req.body);
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({ userId, action: "SAVINGS_GOAL_UPDATED", entityType: "SAVINGS_GOAL", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Savings goal updated successfully", data);
});

export const deleteSavingsGoal = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await savingsGoalService.delete(userId, String(req.params.id));
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({ userId, action: "SAVINGS_GOAL_DELETED", entityType: "SAVINGS_GOAL", entityId: String(req.params.id), oldValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Savings goal deleted successfully", data);
});

export const addSavingsProgress = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await savingsGoalService.addProgress(userId, String(req.params.id), req.body);
  await cacheInvalidation.financeChanged(userId);
  await auditLogService.record({ userId, action: "SAVINGS_PROGRESS_ADDED", entityType: "SAVINGS_GOAL", entityId: data._id.toString(), newValue: serializeAuditValue(data), ...getAuditRequestMeta(req) });
  return sendResponse(res, 200, "Savings progress added successfully", data);
});

export const getSavingsProgress = asyncHandler(async (req, res) => {
  const data = await savingsGoalService.listProgress(req.user!.id, String(req.params.id), req.query as never);
  return sendResponse(res, 200, "Savings progress fetched successfully", data);
});

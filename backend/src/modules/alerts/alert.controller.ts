import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { alertService } from "./alert.service";

export const getAlerts = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.alerts.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Alerts fetched successfully", cached);
  const data = await alertService.list(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.finance);
  return sendResponse(res, 200, "Alerts fetched successfully", data);
});

export const getActiveAlerts = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await alertService.active(userId);
  return sendResponse(res, 200, "Active alerts fetched successfully", data);
});

export const getAlert = asyncHandler(async (req, res) => {
  const data = await alertService.get(req.user!.id, String(req.params.id));
  return sendResponse(res, 200, "Alert fetched successfully", data);
});

export const dismissAlert = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await alertService.updateStatus(userId, String(req.params.id), "DISMISSED");
  await cacheInvalidation.financeChanged(userId);
  return sendResponse(res, 200, "Alert dismissed successfully", data);
});

export const resolveAlert = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await alertService.updateStatus(userId, String(req.params.id), "RESOLVED");
  await cacheInvalidation.financeChanged(userId);
  return sendResponse(res, 200, "Alert resolved successfully", data);
});

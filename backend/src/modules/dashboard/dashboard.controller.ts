import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { dashboardService } from "./dashboard.service";

export const getSummary = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.dashboard.summary(userId);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Dashboard summary fetched successfully", cached);
  }

  const data = await dashboardService.getSummary(userId);
  await cacheService.set(key, data, cacheTtl.dashboardSummary);
  return sendResponse(res, 200, "Dashboard summary fetched successfully", data);
});

export const getMonthlyChart = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const months = Number(req.query.months || 12);
  const key = cacheKeys.dashboard.monthlyChart(userId, { months });
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Monthly chart fetched successfully", cached);
  }

  const data = await dashboardService.getMonthlyChart(userId, months);
  await cacheService.set(key, data, cacheTtl.charts);
  return sendResponse(res, 200, "Monthly chart fetched successfully", data);
});

export const getLoanTypeChart = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.dashboard.loanTypeChart(userId);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Loan type chart fetched successfully", cached);
  }

  const data = await dashboardService.getLoanTypeChart(userId);
  await cacheService.set(key, data, cacheTtl.charts);
  return sendResponse(res, 200, "Loan type chart fetched successfully", data);
});

export const getLoanStatusChart = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.dashboard.loanStatusChart(userId);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Loan status chart fetched successfully", cached);
  }

  const data = await dashboardService.getLoanStatusChart(userId);
  await cacheService.set(key, data, cacheTtl.charts);
  return sendResponse(res, 200, "Loan status chart fetched successfully", data);
});

export const getTopContacts = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const limit = Number(req.query.limit || 5);
  const key = cacheKeys.dashboard.topContacts(userId, { limit });
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Top contacts fetched successfully", cached);
  }

  const data = await dashboardService.getTopContacts(userId, limit);
  await cacheService.set(key, data, cacheTtl.charts);
  return sendResponse(res, 200, "Top contacts fetched successfully", data);
});

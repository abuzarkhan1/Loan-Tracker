import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { spendingInsightService } from "./spending-insight.service";

export const getSpendingHabits = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.spendingInsights.habits(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Spending habits fetched successfully", cached);
  const data = await spendingInsightService.habits(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.reports);
  return sendResponse(res, 200, "Spending habits fetched successfully", data);
});

export const getCategoryTrend = asyncHandler(async (req, res) => {
  const data = await spendingInsightService.categoryTrend(req.user!.id, String(req.params.categoryId), req.query as never);
  return sendResponse(res, 200, "Category trend fetched successfully", data);
});

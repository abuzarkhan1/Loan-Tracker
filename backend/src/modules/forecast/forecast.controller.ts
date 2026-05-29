import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { forecastService } from "./forecast.service";

const cached = async <T>(key: string, factory: () => Promise<T>) => {
  const value = await cacheService.get<T>(key);
  if (value) return value;
  const data = await factory();
  await cacheService.set(key, data, cacheTtl.finance);
  return data;
};

export const getCurrentCycleForecast = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cached(cacheKeys.forecast.currentCycle(userId), () => forecastService.build(userId));
  return sendResponse(res, 200, "Current cycle forecast fetched successfully", data);
});

export const getMonthEndForecast = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const now = new Date();
  const query = { startDate: new Date(now.getFullYear(), now.getMonth(), 1), endDate: new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999) };
  const data = await cached(cacheKeys.forecast.monthEnd(userId), () => forecastService.build(userId, query));
  return sendResponse(res, 200, "Month-end forecast fetched successfully", data);
});

export const getCustomForecast = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cached(cacheKeys.forecast.custom(userId, req.query as never), () => forecastService.build(userId, req.query as never));
  return sendResponse(res, 200, "Custom forecast fetched successfully", data);
});

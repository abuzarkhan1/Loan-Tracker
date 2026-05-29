import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { moneyHealthService } from "./money-health.service";

export const getMoneyHealthScore = asyncHandler(async (req, res) => {
  const key = cacheKeys.phase8.moneyHealth(req.user!.id);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Money health score fetched successfully", cached);
  const data = await moneyHealthService.score(req.user!.id);
  await cacheService.set(key, data, cacheTtl.reports);
  return sendResponse(res, 200, "Money health score fetched successfully", data);
});

import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { activityService } from "./activity.service";

export const getRecentActivity = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.activity.recent(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Recent activity fetched successfully", cached);
  }

  const data = await activityService.getRecentActivity(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.activity);
  return sendResponse(res, 200, "Recent activity fetched successfully", data);
});

import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { trustService } from "./trust.service";

export const getContactTrustProfile = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const contactId = String(req.params.contactId);
  const key = cacheKeys.contacts.trust(userId, contactId);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Contact trust profile fetched successfully", cached);
  }

  const data = await trustService.getContactTrustProfile(userId, contactId);
  await cacheService.set(key, data, cacheTtl.trustProfile);
  return sendResponse(res, 200, "Contact trust profile fetched successfully", data);
});

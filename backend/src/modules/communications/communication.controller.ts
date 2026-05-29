import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { communicationService } from "./communication.service";

export const getContactCommunicationTimeline = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const contactId = String(req.params.contactId);
  const key = cacheKeys.communications.contact(userId, contactId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Communication timeline fetched successfully", cached);
  const data = await communicationService.getContactTimeline(userId, contactId, req.query as never);
  await cacheService.set(key, data, cacheTtl.communication);
  return sendResponse(res, 200, "Communication timeline fetched successfully", data);
});

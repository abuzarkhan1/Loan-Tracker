import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { privacySettingsService } from "./privacy-settings.service";

export const getPrivacySettings = asyncHandler(async (req, res) => sendResponse(res, 200, "Privacy settings fetched successfully", await privacySettingsService.get(req.user!.id)));
export const updatePrivacySettings = asyncHandler(async (req, res) => sendResponse(res, 200, "Privacy settings updated successfully", await privacySettingsService.update(req.user!.id, req.body)));

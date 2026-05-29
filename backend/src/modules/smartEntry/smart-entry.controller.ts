import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { smartEntryService } from "./smart-entry.service";

export const parseSmartEntry = asyncHandler(async (req, res) => {
  const data = await smartEntryService.parse(req.user!.id, req.body);
  return sendResponse(res, 200, "Smart entry parsed successfully", data);
});

export const confirmSmartEntry = asyncHandler(async (req, res) => {
  const data = await smartEntryService.confirm(req.user!.id, req.body);
  return sendResponse(res, 201, "Smart entry confirmed successfully", data);
});

export const getSmartEntryHistory = asyncHandler(async (req, res) => {
  const data = await smartEntryService.history(req.user!.id, req.query as any);
  return sendResponse(res, 200, "Smart entry history fetched successfully", data);
});

export const cancelSmartEntry = asyncHandler(async (req, res) => {
  const data = await smartEntryService.cancel(req.user!.id, String(req.params.id));
  return sendResponse(res, 200, "Smart entry cancelled successfully", data);
});

export const deleteSmartEntry = asyncHandler(async (req, res) => {
  const data = await smartEntryService.delete(req.user!.id, String(req.params.id));
  return sendResponse(res, 200, "Smart entry deleted successfully", data);
});

export const clearSmartEntryHistory = asyncHandler(async (req, res) => {
  const data = await smartEntryService.clearHistory(req.user!.id);
  return sendResponse(res, 200, "Smart entry history cleared successfully", data);
});

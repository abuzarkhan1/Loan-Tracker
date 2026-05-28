import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { dashboardService } from "./dashboard.service";

export const getSummary = asyncHandler(async (req, res) => {
  const data = await dashboardService.getSummary(req.user!.id);
  return sendResponse(res, 200, "Dashboard summary fetched successfully", data);
});

export const getMonthlyChart = asyncHandler(async (req, res) => {
  const months = Number(req.query.months || 12);
  const data = await dashboardService.getMonthlyChart(req.user!.id, months);
  return sendResponse(res, 200, "Monthly chart fetched successfully", data);
});

export const getLoanTypeChart = asyncHandler(async (req, res) => {
  const data = await dashboardService.getLoanTypeChart(req.user!.id);
  return sendResponse(res, 200, "Loan type chart fetched successfully", data);
});

export const getLoanStatusChart = asyncHandler(async (req, res) => {
  const data = await dashboardService.getLoanStatusChart(req.user!.id);
  return sendResponse(res, 200, "Loan status chart fetched successfully", data);
});

export const getTopContacts = asyncHandler(async (req, res) => {
  const limit = Number(req.query.limit || 5);
  const data = await dashboardService.getTopContacts(req.user!.id, limit);
  return sendResponse(res, 200, "Top contacts fetched successfully", data);
});

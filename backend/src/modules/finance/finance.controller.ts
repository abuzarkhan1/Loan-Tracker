import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { financeService } from "./finance.service";

const cached = async <T>(key: string, factory: () => Promise<T>, ttl = cacheTtl.finance) => {
  const value = await cacheService.get<T>(key);
  if (value) return value;
  const data = await factory();
  await cacheService.set(key, data, ttl);
  return data;
};

export const getFinanceDashboard = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cached(cacheKeys.finance.dashboard(userId, req.query as never), () => financeService.dashboard(userId, req.query as never));
  return sendResponse(res, 200, "Finance dashboard fetched successfully", data);
});

export const getCashFlow = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cached(cacheKeys.finance.cashFlow(userId, req.query as never), () => financeService.cashFlow(userId, req.query as never));
  return sendResponse(res, 200, "Cash flow fetched successfully", data);
});

export const getCategoryBreakdown = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cached(cacheKeys.finance.categoryBreakdown(userId, req.query as never), () => financeService.categoryBreakdown(userId, req.query as never));
  return sendResponse(res, 200, "Category breakdown fetched successfully", data);
});

export const getFinancePaymentMethodBreakdown = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cached(cacheKeys.finance.paymentMethodBreakdown(userId, req.query as never), () => financeService.paymentMethodBreakdown(userId, req.query as never));
  return sendResponse(res, 200, "Payment method breakdown fetched successfully", data);
});

export const getFinanceMonthlyReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cached(cacheKeys.finance.monthlyReport(userId, req.query as never), () => financeService.monthlyReport(userId, req.query as never), cacheTtl.reports);
  return sendResponse(res, 200, "Finance monthly report fetched successfully", data);
});

export const getFinanceInsights = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cached(cacheKeys.finance.insights(userId, req.query as never), () => financeService.insights(userId, req.query as never));
  return sendResponse(res, 200, "Finance insights fetched successfully", data);
});

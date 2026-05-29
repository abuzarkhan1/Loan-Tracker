import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { financeService } from "../finance/finance.service";
import { reportService } from "./report.service";

export const createContactPdf = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reportService.createContactPdf(userId, String(req.params.contactId), req.body);
  await auditLogService.record({
    userId,
    action: "PDF_GENERATED",
    entityType: "REPORT",
    entityId: data?._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 202, "Contact PDF report queued successfully", data);
});

export const createMonthlyPdf = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reportService.createMonthlyPdf(userId, req.body.month, req.body.year);
  await auditLogService.record({
    userId,
    action: "PDF_GENERATED",
    entityType: "REPORT",
    entityId: data?._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 202, "Monthly PDF report queued successfully", data);
});

export const createCompleteHistoryPdf = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reportService.createCompleteHistoryPdf(userId);
  await auditLogService.record({
    userId,
    action: "PDF_GENERATED",
    entityType: "REPORT",
    entityId: data?._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 202, "Complete history PDF report queued successfully", data);
});

export const createLoansExcel = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reportService.createLoansExcel(userId, req.body);
  await auditLogService.record({
    userId,
    action: "EXCEL_EXPORTED",
    entityType: "REPORT",
    entityId: data?._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 202, "Loans Excel export queued successfully", data);
});

export const createPaymentsExcel = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reportService.createPaymentsExcel(userId, req.body);
  await auditLogService.record({
    userId,
    action: "EXCEL_EXPORTED",
    entityType: "REPORT",
    entityId: data?._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 202, "Payments Excel export queued successfully", data);
});

export const createContactExcel = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await reportService.createContactExcel(userId, String(req.params.contactId), req.body);
  await auditLogService.record({
    userId,
    action: "EXCEL_EXPORTED",
    entityType: "REPORT",
    entityId: data?._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 202, "Contact Excel export queued successfully", data);
});

export const getReports = asyncHandler(async (req, res) => {
  const data = await reportService.getReports(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Reports fetched successfully", data);
});

const cachedReport = async (userId: string, keyName: string, query: Record<string, unknown>, getter: () => Promise<unknown>) => {
  const key = keyName === "overview"
    ? cacheKeys.reports.overview(userId)
    : cacheKeys.reports.detail(userId, keyName, query as never);
  const cached = await cacheService.get(key);
  if (cached) return cached;
  const data = await getter();
  await cacheService.set(key, data, cacheTtl.reports);
  return data;
};

export const getReportsOverview = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cachedReport(userId, "overview", {}, () => reportService.getOverview(userId));
  return sendResponse(res, 200, "Reports overview fetched successfully", data);
});

export const getMonthlySummaryReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const month = Number(req.query.month || new Date().getMonth() + 1);
  const year = Number(req.query.year || new Date().getFullYear());
  const data = await cachedReport(userId, "monthly-summary", { month, year }, () => reportService.getMonthlySummary(userId, month, year));
  return sendResponse(res, 200, "Monthly summary report fetched successfully", data);
});

export const getOverdueReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cachedReport(userId, "overdue", {}, () => reportService.getOverdueReport(userId));
  return sendResponse(res, 200, "Overdue report fetched successfully", data);
});

export const getPaymentMethodsReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cachedReport(userId, "payment-methods", {}, () => reportService.getPaymentMethods(userId));
  return sendResponse(res, 200, "Payment methods report fetched successfully", data);
});

export const getRecoveryRateReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cachedReport(userId, "recovery-rate", {}, () => reportService.getRecoveryRate(userId));
  return sendResponse(res, 200, "Recovery rate report fetched successfully", data);
});

export const getContactPerformanceReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cachedReport(userId, "contact-performance", {}, () => reportService.getContactPerformance(userId));
  return sendResponse(res, 200, "Contact performance report fetched successfully", data);
});

export const getSalaryVsExpenseReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cachedReport(userId, "salary-vs-expense", req.query as never, () => financeService.salaryVsExpenseReport(userId, req.query as never));
  return sendResponse(res, 200, "Salary vs expense report fetched successfully", data);
});

export const getLoanImpactOnSalaryReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cachedReport(userId, "loan-impact-on-salary", req.query as never, () => financeService.loanImpactOnSalary(userId, req.query as never));
  return sendResponse(res, 200, "Loan impact on salary report fetched successfully", data);
});

export const getBudgetUsageReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cachedReport(userId, "budget-usage", req.query as never, () => financeService.budgetUsage(userId, req.query as never));
  return sendResponse(res, 200, "Budget usage report fetched successfully", data);
});

export const getSavingsProgressReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cachedReport(userId, "savings-progress", req.query as never, () => financeService.savingsProgress(userId));
  return sendResponse(res, 200, "Savings progress report fetched successfully", data);
});

export const getCashFlowTrendReport = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await cachedReport(userId, "cash-flow-trend", req.query as never, () => financeService.cashFlowTrend(userId));
  return sendResponse(res, 200, "Cash flow trend report fetched successfully", data);
});

export const getReport = asyncHandler(async (req, res) => {
  const data = await reportService.getReport(req.user!.id, String(req.params.reportId));
  return sendResponse(res, 200, "Report fetched successfully", data);
});

export const deleteReport = asyncHandler(async (req, res) => {
  const data = await reportService.deleteReport(req.user!.id, String(req.params.reportId));
  return sendResponse(res, 200, "Report deleted successfully", data);
});

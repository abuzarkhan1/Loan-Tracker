import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
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

export const getReport = asyncHandler(async (req, res) => {
  const data = await reportService.getReport(req.user!.id, String(req.params.reportId));
  return sendResponse(res, 200, "Report fetched successfully", data);
});

export const deleteReport = asyncHandler(async (req, res) => {
  const data = await reportService.deleteReport(req.user!.id, String(req.params.reportId));
  return sendResponse(res, 200, "Report deleted successfully", data);
});

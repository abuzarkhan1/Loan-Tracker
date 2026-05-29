import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { emailService } from "./email.service";

const recordEmailAudit = async (req: Parameters<typeof getAuditRequestMeta>[0], data: { _id?: unknown } | null | undefined) => {
  await auditLogService.record({
    userId: req.user!.id,
    action: "EMAIL_QUEUED",
    entityType: "EMAIL",
    entityId: data?._id ? String(data._id) : undefined,
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
};

export const getEmailPreferences = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.email.preferences(userId);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Email preferences fetched successfully", cached);
  const data = await emailService.getPreferences(userId);
  await cacheService.set(key, data, cacheTtl.loanDetail);
  return sendResponse(res, 200, "Email preferences fetched successfully", data);
});

export const updateEmailPreferences = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await emailService.updatePreferences(userId, req.body);
  await cacheService.delByPattern(cacheKeys.email.pattern(userId));
  await auditLogService.record({
    userId,
    action: "SETTINGS_CHANGED",
    entityType: "EMAIL",
    entityId: data._id.toString(),
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Email preferences updated successfully", data);
});

export const getEmailLogs = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.email.logs(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) return sendResponse(res, 200, "Email logs fetched successfully", cached);
  const data = await emailService.getLogs(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Email logs fetched successfully", data);
});

export const retryEmail = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await emailService.retryEmail(userId, String(req.params.id));
  await cacheInvalidation.communicationChanged(userId);
  await auditLogService.record({
    userId,
    action: "EMAIL_QUEUED",
    entityType: "EMAIL",
    entityId: data?._id ? String(data._id) : undefined,
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 202, "Email retry queued successfully", data);
});

export const sendPaymentReceiptEmail = asyncHandler(async (req, res) => {
  const data = await emailService.sendPaymentReceipt(req.user!.id, String(req.params.paymentId), req.body);
  await cacheInvalidation.communicationChanged(req.user!.id);
  await recordEmailAudit(req, data);
  return sendResponse(res, 202, "Payment receipt email queued successfully", data);
});

export const sendLoanSummaryEmail = asyncHandler(async (req, res) => {
  const data = await emailService.sendLoanSummary(req.user!.id, String(req.params.loanId), req.body);
  await cacheInvalidation.communicationChanged(req.user!.id);
  await recordEmailAudit(req, data);
  return sendResponse(res, 202, "Loan summary email queued successfully", data);
});

export const sendContactStatementEmail = asyncHandler(async (req, res) => {
  const data = await emailService.sendContactStatement(req.user!.id, String(req.params.contactId), req.body);
  await cacheInvalidation.communicationChanged(req.user!.id);
  await recordEmailAudit(req, data);
  return sendResponse(res, 202, "Contact statement email queued successfully", data);
});

export const sendMonthlyReportEmail = asyncHandler(async (req, res) => {
  const data = await emailService.sendMonthlyReport(req.user!.id, req.body);
  await cacheInvalidation.communicationChanged(req.user!.id);
  await recordEmailAudit(req, data);
  return sendResponse(res, 202, "Monthly report email queued successfully", data);
});

export const sendOverdueReminderEmail = asyncHandler(async (req, res) => {
  const data = await emailService.sendOverdueReminder(req.user!.id, String(req.params.loanId), req.body);
  await cacheInvalidation.communicationChanged(req.user!.id);
  await recordEmailAudit(req, data);
  return sendResponse(res, 202, "Overdue reminder email queued successfully", data);
});

export const sendPaymentRequestEmail = asyncHandler(async (req, res) => {
  const data = await emailService.sendPaymentRequest(req.user!.id, String(req.params.loanId), req.body);
  await cacheInvalidation.communicationChanged(req.user!.id);
  await recordEmailAudit(req, data);
  return sendResponse(res, 202, "Payment request email queued successfully", data);
});

export const sendSettlementConfirmationEmail = asyncHandler(async (req, res) => {
  const data = await emailService.sendSettlementConfirmation(req.user!.id, String(req.params.loanId), req.body);
  await cacheInvalidation.communicationChanged(req.user!.id);
  await recordEmailAudit(req, data);
  return sendResponse(res, 202, "Settlement confirmation email queued successfully", data);
});

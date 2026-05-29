import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { auditLogService } from "./audit-log.service";

export const getAuditLogs = asyncHandler(async (req, res) => {
  const data = await auditLogService.getAuditLogs(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Audit logs fetched successfully", data);
});

export const getAuditLogDetail = asyncHandler(async (req, res) => {
  const data = await auditLogService.getAuditLog(req.user!.id, String(req.params.auditLogId));
  return sendResponse(res, 200, "Audit log fetched successfully", data);
});

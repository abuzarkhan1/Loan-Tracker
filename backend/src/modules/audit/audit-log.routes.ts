import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { auditLogIdParamSchema, getAuditLogsSchema } from "./audit-log.validation";
import { getAuditLogDetail, getAuditLogs } from "./audit-log.controller";

const router = Router();

router.use(requireAuth);
router.get("/", validateRequest(getAuditLogsSchema), getAuditLogs);
router.get("/:auditLogId", validateRequest(auditLogIdParamSchema), getAuditLogDetail);

export default router;

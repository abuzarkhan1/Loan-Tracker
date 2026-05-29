import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { createBackup, deleteBackup, getBackup, getBackups, restoreBackup } from "./backup.controller";
import { backupIdParamSchema, backupListSchema, restoreBackupSchema } from "./backup.validation";

const router = Router();

router.use(requireAuth);
router.post("/create", createBackup);
router.get("/", validateRequest(backupListSchema), getBackups);
router.get("/:backupId", validateRequest(backupIdParamSchema), getBackup);
router.post("/:backupId/restore", validateRequest(restoreBackupSchema), restoreBackup);
router.delete("/:backupId", validateRequest(backupIdParamSchema), deleteBackup);

export default router;

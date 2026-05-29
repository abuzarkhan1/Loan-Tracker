import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  getNotificationLogsSchema,
  registerPushTokenSchema,
  updateReminderSettingsSchema,
} from "./reminder.validation";
import {
  getReminderLogs,
  getReminderSettings,
  registerPushToken,
  sendTestReminder,
  updateReminderSettings,
} from "./reminder.controller";

const router = Router();

router.use(requireAuth);
router.get("/settings", getReminderSettings);
router.patch("/settings", validateRequest(updateReminderSettingsSchema), updateReminderSettings);
router.post("/register-push-token", validateRequest(registerPushTokenSchema), registerPushToken);
router.get("/logs", validateRequest(getNotificationLogsSchema), getReminderLogs);
router.post("/test", sendTestReminder);

export default router;

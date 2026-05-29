import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createReminderTemplate,
  deleteReminderTemplate,
  getReminderTemplates,
  previewReminderTemplate,
  updateReminderTemplate,
} from "./reminder-template.controller";
import {
  createReminderTemplateSchema,
  reminderTemplateIdSchema,
  reminderTemplateListSchema,
  reminderTemplatePreviewSchema,
  updateReminderTemplateSchema,
} from "./reminder-template.validation";

const router = Router();

router.use(requireAuth);
router.get("/", validateRequest(reminderTemplateListSchema), getReminderTemplates);
router.post("/", validateRequest(createReminderTemplateSchema), createReminderTemplate);
router.post("/preview", validateRequest(reminderTemplatePreviewSchema), previewReminderTemplate);
router.patch("/:id", validateRequest(updateReminderTemplateSchema), updateReminderTemplate);
router.delete("/:id", validateRequest(reminderTemplateIdSchema), deleteReminderTemplate);

export default router;

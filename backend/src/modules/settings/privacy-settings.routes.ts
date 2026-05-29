import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { getPrivacySettings, updatePrivacySettings } from "./privacy-settings.controller";
import { updatePrivacySettingsSchema } from "./privacy-settings.validation";

const router = Router();

router.use(requireAuth);
router.get("/privacy", getPrivacySettings);
router.patch("/privacy", validateRequest(updatePrivacySettingsSchema), updatePrivacySettings);

export default router;

import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { dismissAlert, getActiveAlerts, getAlert, getAlerts, resolveAlert } from "./alert.controller";
import { alertIdSchema, alertListSchema } from "./alert.validation";

const router = Router();

router.use(requireAuth);
router.get("/active", getActiveAlerts);
router.get("/", validateRequest(alertListSchema), getAlerts);
router.get("/:id", validateRequest(alertIdSchema), getAlert);
router.patch("/:id/dismiss", validateRequest(alertIdSchema), dismissAlert);
router.patch("/:id/resolve", validateRequest(alertIdSchema), resolveAlert);

export default router;

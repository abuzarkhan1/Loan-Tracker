import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { getContactCommunicationTimeline } from "./communication.controller";
import { communicationContactSchema } from "./communication.validation";

const router = Router();

router.use(requireAuth);
router.get("/contact/:contactId", validateRequest(communicationContactSchema), getContactCommunicationTimeline);

export default router;

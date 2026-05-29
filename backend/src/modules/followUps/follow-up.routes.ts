import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  createFollowUp,
  deleteFollowUp,
  getContactFollowUps,
  getFollowUps,
  getLoanFollowUps,
  snoozeFollowUp,
  updateFollowUp,
} from "./follow-up.controller";
import {
  createFollowUpSchema,
  followUpContactParamSchema,
  followUpIdSchema,
  followUpListSchema,
  followUpLoanParamSchema,
  snoozeFollowUpSchema,
  updateFollowUpSchema,
} from "./follow-up.validation";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createFollowUpSchema), createFollowUp);
router.get("/", validateRequest(followUpListSchema), getFollowUps);
router.get("/contact/:contactId", validateRequest(followUpContactParamSchema), getContactFollowUps);
router.get("/loan/:loanId", validateRequest(followUpLoanParamSchema), getLoanFollowUps);
router.patch("/:id", validateRequest(updateFollowUpSchema), updateFollowUp);
router.post("/:id/snooze", validateRequest(snoozeFollowUpSchema), snoozeFollowUp);
router.delete("/:id", validateRequest(followUpIdSchema), deleteFollowUp);

export default router;

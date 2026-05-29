import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { cancelSmartEntry, clearSmartEntryHistory, confirmSmartEntry, deleteSmartEntry, getSmartEntryHistory, parseSmartEntry } from "./smart-entry.controller";
import { confirmSmartEntrySchema, parseSmartEntrySchema, smartEntryHistorySchema, smartEntryIdSchema } from "./smart-entry.validation";

const router = Router();

router.use(requireAuth);
router.post("/parse", validateRequest(parseSmartEntrySchema), parseSmartEntry);
router.post("/confirm", validateRequest(confirmSmartEntrySchema), confirmSmartEntry);
router.get("/history", validateRequest(smartEntryHistorySchema), getSmartEntryHistory);
router.delete("/history", clearSmartEntryHistory);
router.patch("/:id/cancel", validateRequest(smartEntryIdSchema), cancelSmartEntry);
router.delete("/:id", validateRequest(smartEntryIdSchema), deleteSmartEntry);

export default router;

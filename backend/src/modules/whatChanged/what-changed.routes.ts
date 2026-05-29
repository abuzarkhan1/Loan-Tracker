import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { getWhatChanged } from "./what-changed.controller";

const router = Router();

router.use(requireAuth);
router.get("/", getWhatChanged);

export default router;

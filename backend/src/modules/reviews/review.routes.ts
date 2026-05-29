import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { generateReview, getCurrentReview, getReview, getReviews } from "./review.controller";
import { reviewIdSchema } from "./review.validation";

const router = Router();

router.use(requireAuth);
router.get("/current-cycle", getCurrentReview);
router.get("/", getReviews);
router.get("/:id", validateRequest(reviewIdSchema), getReview);
router.post("/generate", generateReview);

export default router;

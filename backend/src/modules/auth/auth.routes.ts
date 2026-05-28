import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { getMe, login, register, updateMe } from "./auth.controller";
import { loginSchema, registerSchema, updateMeSchema } from "./auth.validation";

const router = Router();

router.post("/register", validateRequest(registerSchema), register);
router.post("/login", validateRequest(loginSchema), login);
router.get("/me", requireAuth, getMe);
router.patch("/me", requireAuth, validateRequest(updateMeSchema), updateMe);

export default router;

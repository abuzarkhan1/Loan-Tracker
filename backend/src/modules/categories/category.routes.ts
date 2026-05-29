import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { createCategory, deleteCategory, getCategories, updateCategory } from "./category.controller";
import { categoryIdSchema, categoryListSchema, createCategorySchema, updateCategorySchema } from "./category.validation";

const router = Router();

router.use(requireAuth);
router.get("/", validateRequest(categoryListSchema), getCategories);
router.post("/", validateRequest(createCategorySchema), createCategory);
router.patch("/:id", validateRequest(updateCategorySchema), updateCategory);
router.delete("/:id", validateRequest(categoryIdSchema), deleteCategory);

export default router;

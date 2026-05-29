import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  cancelPromise,
  createPromise,
  deletePromise,
  getContactPromises,
  getLoanPromises,
  getPromises,
  markPromiseBroken,
  markPromiseKept,
  updatePromise,
} from "./promise.controller";
import {
  createPromiseSchema,
  promiseContactParamSchema,
  promiseIdSchema,
  promiseListSchema,
  promiseLoanParamSchema,
  updatePromiseSchema,
} from "./promise.validation";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createPromiseSchema), createPromise);
router.get("/", validateRequest(promiseListSchema), getPromises);
router.get("/contact/:contactId", validateRequest(promiseContactParamSchema), getContactPromises);
router.get("/loan/:loanId", validateRequest(promiseLoanParamSchema), getLoanPromises);
router.patch("/:id", validateRequest(updatePromiseSchema), updatePromise);
router.patch("/:id/mark-kept", validateRequest(promiseIdSchema), markPromiseKept);
router.patch("/:id/mark-broken", validateRequest(promiseIdSchema), markPromiseBroken);
router.patch("/:id/cancel", validateRequest(promiseIdSchema), cancelPromise);
router.delete("/:id", validateRequest(promiseIdSchema), deletePromise);

export default router;

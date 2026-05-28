import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import {
  contactIdParamSchema,
  createContactSchema,
  getContactsSchema,
  updateContactSchema,
} from "./contact.validation";
import {
  createContact,
  deleteContact,
  getContactDetail,
  getContacts,
  updateContact,
} from "./contact.controller";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createContactSchema), createContact);
router.get("/", validateRequest(getContactsSchema), getContacts);
router.get("/:contactId", validateRequest(contactIdParamSchema), getContactDetail);
router.patch("/:contactId", validateRequest(updateContactSchema), updateContact);
router.delete("/:contactId", validateRequest(contactIdParamSchema), deleteContact);

export default router;

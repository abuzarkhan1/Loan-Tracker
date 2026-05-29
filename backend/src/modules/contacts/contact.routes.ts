import { Router } from "express";
import { requireAuth } from "../../middleware/auth.middleware";
import { validateRequest } from "../../middleware/validateRequest";
import { getContactTrustProfile } from "../trust/trust.controller";
import {
  bulkImportDeviceContactsSchema,
  contactIdParamSchema,
  contactLimitSchema,
  createContactSchema,
  favoriteContactSchema,
  getContactsSchema,
  importDeviceContactSchema,
  matchContactSchema,
  relationshipSchema,
  updateContactSchema,
} from "./contact.validation";
import {
  bulkImportDeviceContacts,
  createContact,
  deleteContact,
  getFavoriteContacts,
  getContactDetail,
  getContactLedger,
  getContacts,
  getRecentContacts,
  getContactRelationship,
  importDeviceContact,
  matchContact,
  setFavoriteContact,
  touchContactLastUsed,
  updateContactRelationship,
  updateContact,
} from "./contact.controller";

const router = Router();

router.use(requireAuth);
router.post("/", validateRequest(createContactSchema), createContact);
router.get("/", validateRequest(getContactsSchema), getContacts);
router.get("/favorites", validateRequest(contactLimitSchema), getFavoriteContacts);
router.get("/recent", validateRequest(contactLimitSchema), getRecentContacts);
router.get("/match", validateRequest(matchContactSchema), matchContact);
router.post("/import-device-contact", validateRequest(importDeviceContactSchema), importDeviceContact);
router.post("/bulk-import-device-contacts", validateRequest(bulkImportDeviceContactsSchema), bulkImportDeviceContacts);
router.get("/:contactId/ledger", validateRequest(contactIdParamSchema), getContactLedger);
router.get("/:contactId/trust-profile", validateRequest(contactIdParamSchema), getContactTrustProfile);
router.get("/:contactId/relationship", validateRequest(contactIdParamSchema), getContactRelationship);
router.patch("/:contactId/relationship", validateRequest(relationshipSchema), updateContactRelationship);
router.patch("/:contactId/favorite", validateRequest(favoriteContactSchema), setFavoriteContact);
router.patch("/:contactId/last-used", validateRequest(contactIdParamSchema), touchContactLastUsed);
router.get("/:contactId", validateRequest(contactIdParamSchema), getContactDetail);
router.patch("/:contactId", validateRequest(updateContactSchema), updateContact);
router.delete("/:contactId", validateRequest(contactIdParamSchema), deleteContact);

export default router;

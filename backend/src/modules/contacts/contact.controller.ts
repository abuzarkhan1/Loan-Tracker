import { cacheInvalidation } from "../../cache/cache.invalidation";
import { cacheKeys, cacheTtl } from "../../cache/cache.keys";
import { cacheService } from "../../cache/cache.service";
import { auditLogService } from "../audit/audit-log.service";
import { getAuditRequestMeta, serializeAuditValue } from "../audit/audit-log.utils";
import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { contactService } from "./contact.service";

export const createContact = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await contactService.createContact(userId, req.body);
  const contactId = data._id.toString();
  await cacheInvalidation.contactChanged(userId, contactId);
  await auditLogService.record({
    userId,
    action: "CONTACT_CREATED",
    entityType: "CONTACT",
    entityId: contactId,
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 201, "Contact created successfully", data);
});

export const importDeviceContact = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await contactService.importDeviceContact(userId, req.body);
  const contactId = data.contact._id.toString();
  await cacheInvalidation.contactChanged(userId, contactId);
  await auditLogService.record({
    userId,
    action: data.imported ? "CONTACT_IMPORTED" : "CONTACT_UPDATED",
    entityType: "CONTACT",
    entityId: contactId,
    newValue: serializeAuditValue(data.contact),
    metadata: { ...getAuditRequestMeta(req).metadata, imported: data.imported, reason: data.match.reason },
    ip: req.ip,
    userAgent: req.get("user-agent"),
  });
  return sendResponse(res, data.imported ? 201 : 200, data.imported ? "Device contact imported successfully" : "Existing contact matched successfully", data);
});

export const bulkImportDeviceContacts = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const data = await contactService.bulkImportDeviceContacts(userId, req.body.contacts);
  await cacheInvalidation.contactChanged(userId);
  await auditLogService.record({
    userId,
    action: "CONTACT_IMPORTED",
    entityType: "CONTACT",
    newValue: {
      importedCount: data.importedCount,
      skippedCount: data.skippedCount,
      duplicateCount: data.duplicateCount,
    },
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 201, "Device contacts imported successfully", data);
});

export const matchContact = asyncHandler(async (req, res) => {
  const data = await contactService.matchContact(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Contact match checked successfully", data);
});

export const getFavoriteContacts = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.contacts.favorites(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Favorite contacts fetched successfully", cached);
  }

  const data = await contactService.getFavoriteContacts(userId, Number(req.query.limit || 10));
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Favorite contacts fetched successfully", data);
});

export const getRecentContacts = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.contacts.recent(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Recent contacts fetched successfully", cached);
  }

  const data = await contactService.getRecentContacts(userId, Number(req.query.limit || 10));
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Recent contacts fetched successfully", data);
});

export const getContacts = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const key = cacheKeys.contacts.list(userId, req.query as never);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Contacts fetched successfully", cached);
  }

  const data = await contactService.getContacts(userId, req.query as never);
  await cacheService.set(key, data, cacheTtl.lists);
  return sendResponse(res, 200, "Contacts fetched successfully", data);
});

export const getContactDetail = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const contactId = String(req.params.contactId);
  const key = cacheKeys.contacts.detail(userId, contactId);
  const cached = await cacheService.get(key);
  if (cached) {
    return sendResponse(res, 200, "Contact detail fetched successfully", cached);
  }

  const data = await contactService.getContactDetail(userId, contactId);
  await cacheService.set(key, data, cacheTtl.contactDetail);
  return sendResponse(res, 200, "Contact detail fetched successfully", data);
});

export const getContactLedger = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const contactId = String(req.params.contactId);
  const data = await contactService.getContactLedger(userId, contactId);
  return sendResponse(res, 200, "Contact ledger fetched successfully", data);
});

export const updateContact = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const contactId = String(req.params.contactId);
  const data = await contactService.updateContact(userId, contactId, req.body);
  await cacheInvalidation.contactChanged(userId, contactId);
  await auditLogService.record({
    userId,
    action: "CONTACT_UPDATED",
    entityType: "CONTACT",
    entityId: contactId,
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Contact updated successfully", data);
});

export const setFavoriteContact = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const contactId = String(req.params.contactId);
  const data = await contactService.setFavorite(userId, contactId, req.body.isFavorite);
  await cacheInvalidation.contactChanged(userId, contactId);
  await auditLogService.record({
    userId,
    action: req.body.isFavorite ? "CONTACT_FAVORITED" : "CONTACT_UNFAVORITED",
    entityType: "CONTACT",
    entityId: contactId,
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Favorite status updated successfully", data);
});

export const touchContactLastUsed = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const contactId = String(req.params.contactId);
  const data = await contactService.touchLastUsed(userId, contactId);
  await cacheInvalidation.contactChanged(userId, contactId);
  return sendResponse(res, 200, "Contact last used updated successfully", data);
});

export const getContactRelationship = asyncHandler(async (req, res) => {
  const data = await contactService.getRelationship(req.user!.id, String(req.params.contactId));
  return sendResponse(res, 200, "Contact relationship fetched successfully", data);
});

export const updateContactRelationship = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const contactId = String(req.params.contactId);
  const data = await contactService.updateRelationship(userId, contactId, req.body);
  await cacheInvalidation.contactChanged(userId, contactId);
  await auditLogService.record({
    userId,
    action: "RELATIONSHIP_UPDATED",
    entityType: "RELATIONSHIP",
    entityId: contactId,
    newValue: serializeAuditValue(data),
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Contact relationship updated successfully", data);
});

export const deleteContact = asyncHandler(async (req, res) => {
  const userId = req.user!.id;
  const contactId = String(req.params.contactId);
  const data = await contactService.deleteContact(userId, contactId);
  await cacheInvalidation.contactChanged(userId, contactId);
  await auditLogService.record({
    userId,
    action: "CONTACT_DELETED",
    entityType: "CONTACT",
    entityId: contactId,
    oldValue: data,
    ...getAuditRequestMeta(req),
  });
  return sendResponse(res, 200, "Contact deleted successfully", data);
});

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

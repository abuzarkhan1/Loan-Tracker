import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { contactService } from "./contact.service";

export const createContact = asyncHandler(async (req, res) => {
  const data = await contactService.createContact(req.user!.id, req.body);
  return sendResponse(res, 201, "Contact created successfully", data);
});

export const getContacts = asyncHandler(async (req, res) => {
  const data = await contactService.getContacts(req.user!.id, req.query as never);
  return sendResponse(res, 200, "Contacts fetched successfully", data);
});

export const getContactDetail = asyncHandler(async (req, res) => {
  const data = await contactService.getContactDetail(req.user!.id, String(req.params.contactId));
  return sendResponse(res, 200, "Contact detail fetched successfully", data);
});

export const updateContact = asyncHandler(async (req, res) => {
  const data = await contactService.updateContact(req.user!.id, String(req.params.contactId), req.body);
  return sendResponse(res, 200, "Contact updated successfully", data);
});

export const deleteContact = asyncHandler(async (req, res) => {
  const data = await contactService.deleteContact(req.user!.id, String(req.params.contactId));
  return sendResponse(res, 200, "Contact deleted successfully", data);
});

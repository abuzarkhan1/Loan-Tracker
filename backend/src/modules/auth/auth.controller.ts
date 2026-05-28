import { asyncHandler } from "../../utils/asyncHandler";
import { sendResponse } from "../../utils/apiResponse";
import { authService } from "./auth.service";

export const register = asyncHandler(async (req, res) => {
  const data = await authService.register(req.body);
  return sendResponse(res, 201, "Registered successfully", data);
});

export const login = asyncHandler(async (req, res) => {
  const data = await authService.login(req.body);
  return sendResponse(res, 200, "Logged in successfully", data);
});

export const getMe = asyncHandler(async (req, res) => {
  const data = await authService.getCurrentUser(req.user!.id);
  return sendResponse(res, 200, "Current user fetched successfully", data);
});

export const updateMe = asyncHandler(async (req, res) => {
  const data = await authService.updateCurrentUser(req.user!.id, req.body);
  return sendResponse(res, 200, "Profile updated successfully", data);
});

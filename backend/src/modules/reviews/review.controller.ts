import { sendResponse } from "../../utils/apiResponse";
import { asyncHandler } from "../../utils/asyncHandler";
import { reviewService } from "./review.service";

export const getCurrentReview = asyncHandler(async (req, res) => sendResponse(res, 200, "Current review fetched successfully", await reviewService.current(req.user!.id)));
export const getReviews = asyncHandler(async (req, res) => sendResponse(res, 200, "Reviews fetched successfully", await reviewService.list(req.user!.id)));
export const getReview = asyncHandler(async (req, res) => sendResponse(res, 200, "Review fetched successfully", await reviewService.get(req.user!.id, String(req.params.id))));
export const generateReview = asyncHandler(async (req, res) => sendResponse(res, 201, "Review generated successfully", await reviewService.generate(req.user!.id)));

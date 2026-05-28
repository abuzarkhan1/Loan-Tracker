import { NextFunction, Request, Response } from "express";
import { UserModel } from "../modules/auth/user.model";
import { ApiError } from "../utils/apiError";
import { verifyAccessToken } from "../utils/jwt";

export const requireAuth = async (req: Request, _res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      throw new ApiError(401, "Authentication token is required");
    }

    const token = authHeader.split(" ")[1];
    const payload = verifyAccessToken(token);
    const user = await UserModel.findById(payload.userId).select("_id name email");

    if (!user) {
      throw new ApiError(401, "User no longer exists");
    }

    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
    };

    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

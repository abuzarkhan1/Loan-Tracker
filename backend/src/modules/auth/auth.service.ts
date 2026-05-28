import { ApiError } from "../../utils/apiError";
import { comparePassword, hashPassword } from "../../utils/password";
import { signAccessToken } from "../../utils/jwt";
import { UserModel } from "./user.model";

const sanitizeUser = (user: { _id: unknown; name: string; email: string }) => ({
  id: String(user._id),
  name: user.name,
  email: user.email,
});

export const authService = {
  async register(payload: { name: string; email: string; password: string }) {
    const existingUser = await UserModel.findOne({ email: payload.email });
    if (existingUser) {
      throw new ApiError(409, "Email is already registered");
    }

    const password = await hashPassword(payload.password);
    const user = await UserModel.create({
      name: payload.name,
      email: payload.email,
      password,
    });

    const token = signAccessToken(user._id.toString());

    return {
      user: sanitizeUser(user),
      token,
    };
  },

  async login(payload: { email: string; password: string }) {
    const user = await UserModel.findOne({ email: payload.email }).select("+password");
    if (!user) {
      throw new ApiError(401, "Invalid email or password");
    }

    const isPasswordValid = await comparePassword(payload.password, user.password);
    if (!isPasswordValid) {
      throw new ApiError(401, "Invalid email or password");
    }

    const token = signAccessToken(user._id.toString());

    return {
      user: sanitizeUser(user),
      token,
    };
  },

  async getCurrentUser(userId: string) {
    const user = await UserModel.findById(userId).select("_id name email");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    return sanitizeUser(user);
  },

  async updateCurrentUser(userId: string, payload: { name?: string; email?: string }) {
    const user = await UserModel.findById(userId).select("_id name email");
    if (!user) {
      throw new ApiError(404, "User not found");
    }

    if (payload.email && payload.email !== user.email) {
      const existingUser = await UserModel.findOne({ email: payload.email, _id: { $ne: userId } });
      if (existingUser) {
        throw new ApiError(409, "Email is already registered");
      }

      user.email = payload.email;
    }

    if (payload.name) {
      user.name = payload.name;
    }

    await user.save();

    return sanitizeUser(user);
  },
};

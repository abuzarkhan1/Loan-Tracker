import jwt from "jsonwebtoken";
import { env } from "../config/env";

export type JwtPayload = {
  userId: string;
};

export const signAccessToken = (userId: string) => {
  const options: jwt.SignOptions = {
    expiresIn: env.JWT_EXPIRES_IN as jwt.SignOptions["expiresIn"],
  };

  return jwt.sign({ userId }, env.JWT_SECRET, options);
};

export const verifyAccessToken = (token: string) => {
  return jwt.verify(token, env.JWT_SECRET) as JwtPayload;
};

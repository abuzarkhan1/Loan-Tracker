import bcrypt from "bcrypt";
import { env } from "../config/env";

export const hashPassword = (password: string) => {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS);
};

export const comparePassword = (password: string, hash: string) => {
  return bcrypt.compare(password, hash);
};

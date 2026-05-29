import crypto from "crypto";

export const createPublicToken = () => crypto.randomBytes(32).toString("hex");

import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "./logger";

export const connectDB = async () => {
  mongoose.set("strictQuery", true);
  await mongoose.connect(env.MONGODB_URI);
  logger.info("mongodb_connected");
};

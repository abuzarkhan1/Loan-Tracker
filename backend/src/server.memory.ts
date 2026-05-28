import { MongoMemoryServer } from "mongodb-memory-server";
import { app } from "./app";
import { env } from "./config/env";
import mongoose from "mongoose";

const startMemoryServer = async () => {
  const mongo = await MongoMemoryServer.create();
  const uri = mongo.getUri();

  await mongoose.connect(uri);
  console.log(`In-memory MongoDB connected at ${uri}`);

  const server = app.listen(env.PORT, () => {
    console.log(`Server running on port ${env.PORT}`);
  });

  const shutdown = async () => {
    server.close(async () => {
      await mongoose.disconnect();
      await mongo.stop();
      console.log("Server stopped");
      process.exit(0);
    });
  };

  process.on("SIGTERM", shutdown);
  process.on("SIGINT", shutdown);
};

void startMemoryServer().catch((error) => {
  console.error("Failed to start in-memory server", error);
  process.exit(1);
});

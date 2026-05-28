import { env } from "./config/env";
import { connectDB } from "./config/db";
import { app } from "./app";

const startServer = async () => {
  try {
    await connectDB();

    const server = app.listen(env.PORT, () => {
      console.log(`Server running on port ${env.PORT}`);
    });

    const shutdown = () => {
      server.close(() => {
        console.log("Server stopped");
        process.exit(0);
      });
    };

    process.on("SIGTERM", shutdown);
    process.on("SIGINT", shutdown);
  } catch (error) {
    console.error("Failed to start server", error);
    process.exit(1);
  }
};

void startServer();

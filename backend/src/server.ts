import { connectDB } from "./database/index.js";
import dotenv from "dotenv";
import app from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

const shutdown = async () => {
  console.log("[Server] Graceful shutdown initiated...");
  process.exit(0);
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

connectDB()
  .then(async () => {
    app.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      console.log(
        `[Server] Environment: ${process.env.NODE_ENV ?? "development"}`,
      );
    });
  })
  .catch((err) => {
    console.error("[Server] Failed to connect to database:", err);
    process.exit(1);
  });

import { connectDB, disconnectDB } from "./database/index.js";
import dotenv from "dotenv";
import app from "./app.js";
import { createServer } from "http";
import { InterviewSocketServer } from "./services/websocket/InterviewSocketServer.js";
import { closeQueueConnection } from "./services/queue/index.js";

dotenv.config();

const PORT = process.env.PORT || 5000;

let server: ReturnType<typeof createServer> | null = null;
let socketServer: InterviewSocketServer | null = null;

const shutdown = async () => {
  console.log("[Server] Graceful shutdown initiated...");

  try {
    // Close WebSocket server first
    if (socketServer) {
      await socketServer.close();
      console.log("[Server] WebSocket server closed");
    }

    // Close HTTP server to stop accepting new requests
    if (server) {
      await new Promise<void>((resolve, reject) => {
        server!.close((err) => {
          if (err) {
            console.error("[Server] Error closing HTTP server:", err);
            reject(err);
          } else {
            console.log("[Server] HTTP server closed");
            resolve();
          }
        });
      });
    }

    // Close BullMQ connections
    await closeQueueConnection();
    console.log("[Server] Queue connections closed");

    // Disconnect database
    await disconnectDB();
    console.log("[Server] Database disconnected");

    console.log("[Server] Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    console.error("[Server] Error during shutdown:", error);
    process.exit(1);
  }
};

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);

connectDB()
  .then(async () => {
    // Create HTTP server (needed for Socket.io)
    server = createServer(app);

    // Initialize WebSocket server
    socketServer = new InterviewSocketServer(server);
    console.log("[Server] WebSocket server initialized");

    // Start listening
    server.listen(PORT, () => {
      console.log(`[Server] Running on port ${PORT}`);
      console.log(
        `[Server] Environment: ${process.env.NODE_ENV ?? "development"}`,
      );
      console.log(`[Server] WebSocket available at ws://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error("[Server] Failed to connect to database:", err);
    process.exit(1);
  });

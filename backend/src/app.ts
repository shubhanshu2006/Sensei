import cors from "cors";
import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { ApiResponse } from "./utils/ApiResponse.js";
import apiRouter from "./routes/index.js";
import { errorHandler } from "./middleware/error.middleware.js";
import { prisma } from "./database/client.js";
import { apiLimiter } from "./middleware/rateLimiter.middleware.js";

dotenv.config();

const app = express();

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean)
  : ["http://localhost:3000"];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests without an Origin header
      // e.g. Postman, server-to-server requests, health checks
      if (!origin) {
        return callback(null, true);
      }

      // Allow configured origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }

      // Allow all origins in development
      if (process.env.NODE_ENV !== "production") {
        return callback(null, true);
      }

      return callback(new Error(`CORS: origin ${origin} not allowed`));
    },

    credentials: true,

    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],

    allowedHeaders: ["Content-Type", "Authorization", "X-Device-Fingerprint"],
  }),
);

app.use(
  "/api/v1/payments/webhook",
  express.raw({ type: "application/json" }),
  (req, res, next) => {
    if (req.body) {
      (req as any).rawBody = req.body.toString("utf8");
    }

    next();
  },
);

app.use(express.json());

app.use(
  express.urlencoded({
    extended: true,
  }),
);

app.use(express.static("public"));

app.use(cookieParser());

app.use(helmet());

app.use("/api/v1", apiLimiter);

app.use("/api/v1", apiRouter);

app.get("/health", async (req, res) => {
  const startTime = Date.now();

  const health = {
    status: "healthy" as "healthy" | "degraded",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),

    environment: process.env.NODE_ENV || "development",

    version: process.env.npm_package_version || "1.0.0",

    services: {
      database: {
        status: "unknown" as "unknown" | "connected" | "disconnected",
        responseTime: 0,
      },

      redis: {
        status: "unknown" as "unknown" | "connected" | "disconnected",
        responseTime: 0,
      },
    },
  };

  try {
    const dbStart = Date.now();

    await prisma.$queryRaw`SELECT 1`;

    health.services.database = {
      status: "connected",
      responseTime: Date.now() - dbStart,
    };
  } catch (error) {
    health.status = "degraded";

    health.services.database = {
      status: "disconnected",
      responseTime: 0,
    };
  }

  try {
    const redisStart = Date.now();

    const { connection } = await import("./services/queue/index.js");

    await connection.ping();

    health.services.redis = {
      status: "connected",
      responseTime: Date.now() - redisStart,
    };
  } catch (error) {
    health.status = "degraded";

    health.services.redis = {
      status: "disconnected",
      responseTime: 0,
    };
  }

  const statusCode = health.status === "healthy" ? 200 : 503;

  const totalResponseTime = Date.now() - startTime;

  const response = new ApiResponse(
    statusCode,
    {
      ...health,
      responseTime: totalResponseTime,
    },
    `Health check ${health.status}`,
  );

  res.status(statusCode).json(response);
});

app.use(errorHandler);

export default app;

import "dotenv/config";
import { z } from "zod";

// Environment Variable Schema (Zod Validation)

const envSchema = z.object({
  // Application
  NODE_ENV: z
    .enum(["development", "production", "test"])
    .default("development"),
  PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default(5000),
  API_VERSION: z.string().default("v1"),
  FRONTEND_URL: z.string().url().default("http://localhost:3000"),
  ALLOWED_ORIGINS: z.string().default("http://localhost:3000"),

  // Database (Prisma v7 reads from DATABASE_URL automatically)
  DATABASE_URL: z.string().url(),

  // Clerk Authentication
  CLERK_SECRET_KEY: z.string().startsWith("sk_"),
  CLERK_WEBHOOK_SECRET: z.string().optional().default(""),

  // Redis (optional for development, required for production)
  REDIS_URL: z.string().optional(),
  REDIS_HOST: z.string().default("127.0.0.1"),
  REDIS_PORT: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default(6379),
  REDIS_PASSWORD: z.string().optional().default(""),

  // AWS S3
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  AWS_S3_BUCKET_NAME: z.string().min(1),
  AWS_REGION: z.string().default("ap-south-1"),

  // AI (Groq Multi-Key Pool, Hugging Face Fallback & Gemini)
  GROQ_API_KEY: z.string().optional().default(""),
  GROQ_API_KEY_1: z.string().optional().default(""),
  GROQ_API_KEY_2: z.string().optional().default(""),
  GROQ_API_KEY_3: z.string().optional().default(""),
  GROQ_API_KEY_4: z.string().optional().default(""),
  GROQ_API_KEY_5: z.string().optional().default(""),
  GROQ_API_KEY_SECONDARY: z.string().optional().default(""),
  GROQ_API_KEYS: z.string().optional().default(""),
  GROQ_PRIMARY_MODEL: z.string().default("openai/gpt-oss-120b"),
  GROQ_FAST_MODEL: z.string().default("openai/gpt-oss-20b"),
  GROQ_WHISPER_MODEL: z.string().default("whisper-large-v3-turbo"),
  HF_TOKEN: z.string().optional().default(""),
  HUGGINGFACE_API_KEY: z.string().optional().default(""),
  GOOGLE_API_KEY: z.string().optional().default(""),
  GEMINI_MODEL: z.string().default("gemini-3.8-flash"),

  // Payment (Razorpay & UPI QR)
  RAZORPAY_KEY_ID: z.string().startsWith("rzp_"),
  RAZORPAY_KEY_SECRET: z.string().min(1),
  RAZORPAY_WEBHOOK_SECRET: z.string().startsWith("whsec_"),
  PAYMENT_UPI_ID: z.string().default("sensei@upi"),
  PAYMENT_UPI_NAME: z.string().default("Sensei AI"),
  PAYMENT_MODE: z.enum(["QR_CODE", "RAZORPAY"]).default("QR_CODE"),

  // Email (Brevo)
  BREVO_API_KEY: z.string().min(1),
  EMAIL_FROM: z.string().email().default("no-reply@sensei.dev"),
  EMAIL_FROM_NAME: z.string().default("Sensei"),

  // Security
  JWT_SECRET: z.string().min(32, "JWT secret must be at least 32 characters"),
  SESSION_TIMEOUT_MINUTES: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default(60),

  // Interview Configuration
  INTERVIEW_MAX_QUESTIONS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(5).max(20))
    .default(10),
  INTERVIEW_CREDIT_CONSUMPTION_THRESHOLD: z
    .string()
    .transform(Number)
    .pipe(z.number().int().min(1).max(10))
    .default(7),
  INTERVIEW_TIMEOUT_MINUTES: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default(45),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default(900000),
  RATE_LIMIT_MAX_REQUESTS: z
    .string()
    .transform(Number)
    .pipe(z.number().int().positive())
    .default(100),

  // FingerprintJS (optional for development)
  FINGERPRINT_API_KEY: z.string().optional().default(""),
  FINGERPRINT_PUBLIC_KEY: z.string().optional().default(""),
});

// ---------------------------------------------------------------------------
// Validate and Parse Environment Variables
// ---------------------------------------------------------------------------

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    console.error("❌ Invalid environment variables:");
    console.error("━".repeat(80));

    const errors = result.error.flatten().fieldErrors;
    Object.entries(errors).forEach(([key, messages]) => {
      console.error(`  ${key}:`);
      messages?.forEach((msg) => console.error(`    - ${msg}`));
    });

    console.error("━".repeat(80));
    console.error(
      "\n💡 Please check your .env file and ensure all required variables are set.\n",
    );
    process.exit(1);
  }

  return result.data;
};

const env = parseEnv();

// ---------------------------------------------------------------------------
// Typed Config Object
// ---------------------------------------------------------------------------

export const config = {
  env: env.NODE_ENV,
  port: env.PORT,
  apiVersion: env.API_VERSION,
  frontendUrl: env.FRONTEND_URL,
  allowedOrigins: env.ALLOWED_ORIGINS.split(",")
    .map((o) => o.trim())
    .filter(Boolean),

  database: {
    url: env.DATABASE_URL,
  },

  clerk: {
    secretKey: env.CLERK_SECRET_KEY,
    webhookSecret: env.CLERK_WEBHOOK_SECRET,
  },

  redis: {
    url: env.REDIS_URL ?? "",
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    password: env.REDIS_PASSWORD,
  },

  aws: {
    accessKeyId: env.AWS_ACCESS_KEY_ID,
    secretAccessKey: env.AWS_SECRET_ACCESS_KEY,
    s3Bucket: env.AWS_S3_BUCKET_NAME,
    region: env.AWS_REGION,
  },

  groq: {
    apiKey: env.GROQ_API_KEY || env.GROQ_API_KEY_1 || "",
    secondaryApiKey: env.GROQ_API_KEY_2 || env.GROQ_API_KEY_SECONDARY || "",
    apiKeys: Array.from(
      new Set(
        [
          env.GROQ_API_KEY_1 || env.GROQ_API_KEY,
          env.GROQ_API_KEY_2 || env.GROQ_API_KEY_SECONDARY,
          env.GROQ_API_KEY_3,
          env.GROQ_API_KEY_4,
          env.GROQ_API_KEY_5,
          ...(env.GROQ_API_KEYS ? env.GROQ_API_KEYS.split(",") : []),
          // Automatically pick up any additional GROQ_API_KEY_* from process.env in numerical order
          ...Object.keys(process.env)
            .filter((k) => /^GROQ_API_KEY_\d+$/i.test(k))
            .sort((a, b) => {
              const numA = parseInt(a.replace(/\D/g, ""), 10) || 0;
              const numB = parseInt(b.replace(/\D/g, ""), 10) || 0;
              return numA - numB;
            })
            .map((k) => process.env[k]),
        ]
          .map((k) => k?.trim())
          .filter(Boolean) as string[],
      ),
    ),
    primaryModel: env.GROQ_PRIMARY_MODEL,
    fastModel: env.GROQ_FAST_MODEL,
    whisperModel: env.GROQ_WHISPER_MODEL,
  },

  huggingface: {
    apiKey: env.HF_TOKEN || env.HUGGINGFACE_API_KEY || "",
    baseUrl: "https://router.huggingface.co/v1",
  },

  gemini: {
    apiKey: env.GOOGLE_API_KEY,
    model: env.GEMINI_MODEL,
  },

  payment: {
    razorpayKeyId: env.RAZORPAY_KEY_ID,
    razorpayKeySecret: env.RAZORPAY_KEY_SECRET,
    razorpayWebhookSecret: env.RAZORPAY_WEBHOOK_SECRET,
    upiId: env.PAYMENT_UPI_ID,
    upiName: env.PAYMENT_UPI_NAME,
    mode: env.PAYMENT_MODE,
  },

  brevo: {
    apiKey: env.BREVO_API_KEY,
    apiUser: env.BREVO_API_KEY, // Brevo uses API key as SMTP username
    fromEmail: env.EMAIL_FROM,
    fromName: env.EMAIL_FROM_NAME,
  },

  security: {
    jwtSecret: env.JWT_SECRET,
    sessionTimeoutMinutes: env.SESSION_TIMEOUT_MINUTES,
  },

  interview: {
    maxQuestions: env.INTERVIEW_MAX_QUESTIONS,
    creditConsumptionThreshold: env.INTERVIEW_CREDIT_CONSUMPTION_THRESHOLD,
    timeoutMinutes: env.INTERVIEW_TIMEOUT_MINUTES,
  },

  rateLimit: {
    windowMs: env.RATE_LIMIT_WINDOW_MS,
    maxRequests: env.RATE_LIMIT_MAX_REQUESTS,
  },

  fingerprint: {
    apiKey: env.FINGERPRINT_API_KEY,
    publicKey: env.FINGERPRINT_PUBLIC_KEY,
  },
} as const;

// ---------------------------------------------------------------------------
// Type Export
// ---------------------------------------------------------------------------

export type Config = typeof config;

// ---------------------------------------------------------------------------
// Helper to validate environment on startup
// ---------------------------------------------------------------------------

export const validateConfig = () => {
  // Additional runtime checks for production
  if (config.env === "production") {
    const productionChecks = {
      "JWT_SECRET length": config.security.jwtSecret.length >= 32,
      "Redis configured": config.redis.url !== "",
    };

    const failed = Object.entries(productionChecks)
      .filter(([, passed]) => !passed)
      .map(([check]) => check);

    if (failed.length > 0) {
      console.warn("⚠️  Production environment warnings:");
      failed.forEach((check) => console.warn(`   - ${check}`));
      console.warn("");
    }
  }

  console.log("✅ Configuration validated successfully");
};

import { prisma } from "./client.js";

let isConnected = false;

export const connectDB = async () => {
  if (isConnected) {
    console.log("[Database] Already connected");
    return;
  }

  try {
    await prisma.$connect();
    isConnected = true;
    console.log("[Database] Connected successfully");
    await initCreditRequestsTable();
  } catch (error) {
    console.error("[Database] Connection failed:", error);
    process.exit(1);
  }
};

export const disconnectDB = async () => {
  if (!isConnected) {
    return;
  }

  try {
    await prisma.$disconnect();
    isConnected = false;
    console.log("[Database] Disconnected successfully");
  } catch (error) {
    console.error("[Database] Disconnect failed:", error);
    throw error;
  }
};

export const initCreditRequestsTable = async () => {
  try {
    await prisma.$executeRawUnsafe(`
      CREATE TABLE IF NOT EXISTS "CreditPurchaseRequest" (
        "id" TEXT NOT NULL PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "userRole" TEXT NOT NULL,
        "packageId" TEXT NOT NULL,
        "packageName" TEXT NOT NULL,
        "credits" INTEGER NOT NULL,
        "amount" DECIMAL(10, 2) NOT NULL,
        "currency" TEXT NOT NULL DEFAULT 'INR',
        "utrNumber" TEXT NOT NULL,
        "status" TEXT NOT NULL DEFAULT 'PENDING',
        "adminNote" TEXT,
        "approvedBy" TEXT,
        "approvedAt" TIMESTAMP(3),
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT "CreditPurchaseRequest_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE
      );
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CreditPurchaseRequest_userId_idx" ON "CreditPurchaseRequest"("userId");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CreditPurchaseRequest_status_idx" ON "CreditPurchaseRequest"("status");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CreditPurchaseRequest_utrNumber_idx" ON "CreditPurchaseRequest"("utrNumber");
    `);
    await prisma.$executeRawUnsafe(`
      CREATE INDEX IF NOT EXISTS "CreditPurchaseRequest_createdAt_idx" ON "CreditPurchaseRequest"("createdAt");
    `);
    console.log("[Database] CreditPurchaseRequest table verified/initialized");
  } catch (err) {
    console.warn("[Database] Could not verify/initialize CreditPurchaseRequest table:", err);
  }
};


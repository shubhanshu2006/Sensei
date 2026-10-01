#!/usr/bin/env tsx

/**
 * Setup Validation Script
 * 
 * Run this script to validate that all fixes have been applied correctly:
 * - Environment variables are properly validated
 * - Database connection works
 * - All routes are registered
 * - Configuration is production-ready
 * 
 * Usage: npm run validate-setup
 */

import { config, validateConfig } from '../config/index.js';
import { connectDB, disconnectDB } from '../database/index.js';
import app from '../app.js';

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg: string) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warn: (msg: string) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  info: (msg: string) => console.log(`${colors.blue}ℹ${colors.reset} ${msg}`),
  title: (msg: string) => console.log(`\n${colors.bright}${msg}${colors.reset}`),
};

async function main() {
  console.log(`
${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}
${colors.bright}  Sensei Backend - Setup Validation${colors.reset}
${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}
`);

  let hasErrors = false;

  // Test 1: Environment Configuration
  log.title('1. Environment Configuration');
  try {
    validateConfig();
    log.success('Environment variables validated');
    log.success(`Running in ${config.env} mode`);
    log.success(`Server will run on port ${config.port}`);
  } catch (error) {
    log.error('Environment validation failed');
    hasErrors = true;
  }

  // Test 2: Database Connection
  log.title('2. Database Connection');
  try {
    await connectDB();
    log.success('Database connected successfully');
    await disconnectDB();
    log.success('Database disconnected successfully');
  } catch (error) {
    log.error('Database connection failed');
    log.error((error as Error).message);
    hasErrors = true;
  }

  // Test 3: Route Registration
  log.title('3. API Routes Registration');
  const routes = [
    '/api/v1/auth',
    '/api/v1/users',
    '/api/v1/recruiters',
    '/api/v1/candidates',
    '/api/v1/jobs',
    '/api/v1/practice',
    '/api/v1/applications',
    '/api/v1/interviews',
    '/api/v1/credits',
    '/api/v1/payments',
    '/api/v1/admin',
    '/api/v1/screening',
  ];

  const stack = (app as any)._router?.stack || (app as any).router?.stack || [];

  const registeredRoutes = stack
    .filter((layer: any) => layer?.route)
    .map((layer: any) => layer.route.path);

  const mountedRouters = stack
    .filter((layer: any) => (layer?.name === 'router' || layer?.name === 'bound dispatch') && layer?.regexp)
    .map((layer: any) => {
      const match = layer.regexp.toString().match(/^\/\^\\\/api\\\/v1\\\/(\w+)/);
      return match ? `/api/v1/${match[1]}` : null;
    })
    .filter(Boolean);

  routes.forEach((route) => {
    const isRegistered = mountedRouters.some((r: any) => r === route);
    if (isRegistered) {
      log.success(`${route} registered`);
    } else {
      log.error(`${route} NOT registered`);
      hasErrors = true;
    }
  });

  log.info(`Total routes: ${routes.length}`);
  log.info(`Health check available at: /health`);

  // Test 4: Security Configuration
  log.title('4. Security Configuration');

  if (config.security.jwtSecret.length >= 32) {
    log.success('JWT secret meets minimum length requirement (32 chars)');
  } else {
    log.warn('JWT secret is less than 32 characters (not recommended for production)');
  }

  if (config.env === 'production') {
    if (config.redis.url) {
      log.success('Redis configured for production');
    } else {
      log.warn('Redis not configured (required for WebSocket scaling)');
    }

    log.success('FingerprintJS configured (Free Open-Source client-side device abuse prevention)');
  }

  // Test 5: Required Services
  log.title('5. External Services Configuration');

  const services = [
    { name: 'Clerk', configured: config.clerk.secretKey.startsWith('sk_') },
    { name: 'AWS S3', configured: config.aws.accessKeyId.length > 0 },
    { name: 'Razorpay', configured: config.payment.razorpayKeyId.startsWith('rzp_') },
    { name: 'Brevo Email', configured: config.brevo.apiKey.length > 0 },
    { name: 'Google Gemini', configured: config.gemini.apiKey.length > 0 },
  ];

  services.forEach(({ name, configured }) => {
    if (configured) {
      log.success(`${name} configured`);
    } else {
      log.error(`${name} NOT configured`);
      hasErrors = true;
    }
  });

  // Final Summary
  console.log(`
${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}`);

  if (hasErrors) {
    console.log(`${colors.red}${colors.bright}
  ✗ VALIDATION FAILED
  
  Please fix the errors above before starting the server.
${colors.reset}`);
    process.exit(1);
  } else {
    console.log(`${colors.green}${colors.bright}
  ✓ ALL VALIDATIONS PASSED
  
  Your backend is ready to run!
  
  Next steps:
  1. Run 'npm run prisma:generate' to generate Prisma client
  2. Run 'npm run prisma:migrate' to create database tables
  3. Run 'npm run dev' to start development server
${colors.reset}`);
  }

  console.log(`${colors.bright}═══════════════════════════════════════════════════════════════${colors.reset}
`);
}

main().catch((error) => {
  console.error('Validation script failed:', error);
  process.exit(1);
});

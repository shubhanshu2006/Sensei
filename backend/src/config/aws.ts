import { S3Client } from '@aws-sdk/client-s3';
import { config } from './index.js';

/**
 * Shared S3 client instance configured from environment variables.
 * Re-use this singleton across all AWS S3 operations.
 */
export const s3Client = new S3Client({
  region: config.aws.region,
  credentials: {
    accessKeyId: config.aws.accessKeyId,
    secretAccessKey: config.aws.secretAccessKey,
  },
});

/**
 * S3 bucket name resolved from config at module-init time.
 * Accessing it directly avoids repeated config look-ups at call sites.
 */
export const S3_BUCKET: string = config.aws.s3Bucket;

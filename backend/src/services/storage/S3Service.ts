import {
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
  GetObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { config } from "../../config/index.js";
import { logger } from "../../utils/logger.js";
import { ApiError } from "../../utils/ApiError.js";

// S3Service - AWS S3 operations for file storage
//
// Handles:
// - Pre-signed URLs for direct client uploads (avoids proxy through backend)
// - Pre-signed URLs for secure downloads
// - File deletion
// - Organized folder structure by user type

export class S3Service {
  private s3Client: S3Client;
  private bucket: string;

  constructor() {
    this.s3Client = new S3Client({
      region: config.aws.region,
      credentials: {
        accessKeyId: config.aws.accessKeyId,
        secretAccessKey: config.aws.secretAccessKey,
      },
    });
    this.bucket = config.aws.s3Bucket;
  }

  // generateUploadUrl
  // Returns a pre-signed URL that clients use to upload files directly to S3.
  // This avoids proxying large files through the backend server.
  //
  // Folder structure:
  //   resumes/candidates/{candidateId}/{filename}
  //   resumes/applications/{applicationId}/{filename}
  //
  // URL expires in 15 minutes by default.

  async generateUploadUrl(
    folder: "candidates" | "applications",
    id: string,
    fileName: string,
    contentType: string,
    expiresIn: number = 900, // 15 minutes
  ): Promise<{ uploadUrl: string; fileKey: string; fileUrl: string }> {
    try {
      // Sanitize filename: remove special chars, spaces → hyphens
      const sanitizedName = fileName
        .replace(/[^a-zA-Z0-9.-]/g, "-")
        .replace(/--+/g, "-")
        .toLowerCase();

      // Construct S3 key (path)
      const fileKey = `resumes/${folder}/${id}/${Date.now()}-${sanitizedName}`;

      // Create pre-signed PUT URL
      const command = new PutObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
        ContentType: contentType,
      });

      const uploadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      // Construct the permanent file URL (no query params)
      const fileUrl = `https://${this.bucket}.s3.${config.aws.region}.amazonaws.com/${fileKey}`;

      logger.info(`[S3Service] Upload URL generated: ${fileKey}`);

      return { uploadUrl, fileKey, fileUrl };
    } catch (error) {
      logger.error("[S3Service] Failed to generate upload URL", error);
      throw new ApiError(500, "Failed to generate upload URL");
    }
  }

  // generateDownloadUrl
  // Returns a pre-signed URL for secure file downloads.
  // URL expires in 1 hour by default.

  async generateDownloadUrl(
    fileKey: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      logger.info(`[S3Service] Download URL generated: ${fileKey}`);

      return downloadUrl;
    } catch (error) {
      logger.error("[S3Service] Failed to generate download URL", error);
      throw new ApiError(500, "Failed to generate download URL");
    }
  }

  // deleteFile
  // Permanently deletes a file from S3.
  // Called when a user deletes their resume or an application is withdrawn.

  async deleteFile(fileKey: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      await this.s3Client.send(command);

      logger.info(`[S3Service] File deleted: ${fileKey}`);
    } catch (error) {
      logger.error("[S3Service] Failed to delete file", error);
      throw new ApiError(500, "Failed to delete file");
    }
  }
  // -------------------------------------------------------------------------
  // extractKeyFromUrl
  // Utility to extract the S3 key from a full S3 URL.

  extractKeyFromUrl(fileUrl: string): string {
    try {
      const url = new URL(fileUrl);
      // Remove leading slash
      return url.pathname.substring(1);
    } catch (error) {
      logger.error("[S3Service] Invalid S3 URL", { fileUrl });
      throw new ApiError(400, "Invalid S3 URL format");
    }
  }

  // getFileMetadata
  // Returns file metadata (size, content type, last modified).
  // Used for validation and display purposes.

  async getFileMetadata(
    fileKey: string,
  ): Promise<{ size: number; contentType: string; lastModified: Date }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucket,
        Key: fileKey,
      });

      const response = await this.s3Client.send(command);

      return {
        size: response.ContentLength ?? 0,
        contentType: response.ContentType ?? "application/octet-stream",
        lastModified: response.LastModified ?? new Date(),
      };
    } catch (error) {
      logger.error("[S3Service] Failed to get file metadata", error);
      throw new ApiError(404, "File not found");
    }
  }
}

// Singleton export

export const s3Service = new S3Service();

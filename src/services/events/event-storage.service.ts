/**
 * Events Domain - Event Image Storage Service
 * Manages secure server-side uploads to the 'event-images' Supabase storage bucket.
 */

import { supabase } from "@/db";
import { uploadConfig } from "@/core/config/uploads";
import { BadRequestError } from "@/core/errors";
import { logger } from "@/core/logger";
import { UUID } from "@/core/types";

export interface ImageUploadInput {
  buffer: Buffer | Uint8Array;
  mimeType: string;
  originalName: string;
}

export interface ImageUploadResult {
  imageUrl: string;
  storagePath: string;
  fileSizeBytes: number;
  mimeType: string;
}

export class EventStorageService {
  private readonly bucket = uploadConfig.buckets.events || "event-images";
  private readonly maxSizeBytes = uploadConfig.maxFileSize || 2 * 1024 * 1024; // 2MB
  private readonly allowedMimeTypes = uploadConfig.allowedMimeTypes || [
    "image/jpeg",
    "image/png",
    "image/webp",
  ];

  /**
   * Uploads an event project submission image to Supabase Storage with strict isolation and validation.
   */
  public async uploadSubmissionImage(
    eventId: UUID,
    submissionId: UUID,
    file: ImageUploadInput
  ): Promise<ImageUploadResult> {
    // 1. Validate MIME type
    if (!this.allowedMimeTypes.includes(file.mimeType as any)) {
      throw new BadRequestError(
        `Invalid file type "${file.mimeType}". Allowed formats: JPG, PNG, WEBP.`
      );
    }

    // 2. Validate file size
    const size = file.buffer.byteLength;
    if (size > this.maxSizeBytes) {
      throw new BadRequestError(
        `File size (${(size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum limit of ${(
          this.maxSizeBytes / (1024 * 1024)
        ).toFixed(0)} MB.`
      );
    }

    // 3. Generate deterministic isolated path
    const ext = file.mimeType.split("/")[1] || "png";
    const cleanExt = ext === "jpeg" ? "jpg" : ext;
    const uniqueSuffix = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
    const storagePath = `events/${eventId}/submissions/${submissionId}/${uniqueSuffix}.${cleanExt}`;

    try {
      const { data, error } = await supabase.storage
        .from(this.bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimeType,
          upsert: true,
        });

      if (error) {
        logger.error("[EventStorageService] Storage upload error", error);
        throw new Error(`Failed to upload image: ${error.message}`);
      }

      // 4. Retrieve Public URL
      const { data: urlData } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(storagePath);

      return {
        imageUrl: urlData.publicUrl,
        storagePath,
        fileSizeBytes: size,
        mimeType: file.mimeType,
      };
    } catch (err: any) {
      logger.error("[EventStorageService] Upload exception", err);
      throw new BadRequestError(err.message || "Failed to process image upload.");
    }
  }

  /**
   * Uploads an event cover banner image with secure server-side isolation
   */
  public async uploadEventCoverImage(
    eventId: UUID,
    file: ImageUploadInput
  ): Promise<ImageUploadResult> {
    if (!this.allowedMimeTypes.includes(file.mimeType as any)) {
      throw new BadRequestError(
        `Invalid file type "${file.mimeType}". Allowed formats: JPG, PNG, WEBP.`
      );
    }

    const size = file.buffer.byteLength;
    if (size > this.maxSizeBytes) {
      throw new BadRequestError(
        `File size (${(size / (1024 * 1024)).toFixed(2)} MB) exceeds the maximum limit of ${(
          this.maxSizeBytes / (1024 * 1024)
        ).toFixed(0)} MB.`
      );
    }

    const ext = file.mimeType.split("/")[1] || "png";
    const cleanExt = ext === "jpeg" ? "jpg" : ext;
    const storagePath = `events/${eventId}/cover/cover_${Date.now()}.${cleanExt}`;

    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .upload(storagePath, file.buffer, {
          contentType: file.mimeType,
          upsert: true,
        });

      if (error) {
        logger.error("[EventStorageService] Cover image storage upload error", error);
        throw new Error(`Failed to upload cover image: ${error.message}`);
      }

      const { data: urlData } = supabase.storage
        .from(this.bucket)
        .getPublicUrl(storagePath);

      return {
        imageUrl: urlData.publicUrl,
        storagePath,
        fileSizeBytes: size,
        mimeType: file.mimeType,
      };
    } catch (err: any) {
      logger.error("[EventStorageService] Cover upload exception", err);
      throw new BadRequestError(err.message || "Failed to process cover image upload.");
    }
  }

  /**
   * Removes an image from storage
   */
  public async deleteImage(storagePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(this.bucket)
        .remove([storagePath]);

      if (error) {
        logger.error("[EventStorageService] Delete image error", error);
        return false;
      }
      return true;
    } catch (err) {
      logger.error("[EventStorageService] Delete image exception", err);
      return false;
    }
  }
}

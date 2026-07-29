/**
 * File Upload Configurations
 */

import { FILE_UPLOAD_CONSTANTS } from "../constants";

export const uploadConfig = Object.freeze({
  maxFileSize: FILE_UPLOAD_CONSTANTS.MAX_FILE_SIZE_BYTES,
  allowedMimeTypes: FILE_UPLOAD_CONSTANTS.ALLOWED_IMAGE_TYPES,
  
  limits: {
    maxMemberPhotos: 1,
    maxEventAttachments: 5,
    maxInventoryManuals: 1,
  },

  // Storage buckets on Supabase
  buckets: {
    avatars: "member-avatars",
    inventory: "inventory-docs",
    events: "event-images",
  },
});

export type UploadConfig = typeof uploadConfig;

/**
 * Shared System Fallback Defaults Configuration
 */

export const defaultsConfig = Object.freeze({
  memberPhotoFallback: "/assets/avatar-placeholder.png",
  clubLogoUrl: "/assets/logo.png",
  
  scanner: {
    cameraFacingMode: "environment" as const,
    fps: 10,
    qrBoxSize: 250,
  },
  
  sessionTimeoutMinutes: 30,
});

export type DefaultsConfig = typeof defaultsConfig;

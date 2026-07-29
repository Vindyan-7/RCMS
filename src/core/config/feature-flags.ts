/**
 * Feature Flags Configuration for RCMS Modules
 */

export const featureFlagsConfig = Object.freeze({
  // Version 1.0 Modules (Always Enabled)
  enableMembersModule: true,
  enableAttendanceModule: true,
  enableActivitiesModule: true,
  enableInventoryModule: true,
  enableAdminModule: true,
  enableAuditEngine: true,

  // Version 2.0 / 3.0 Modules (Postponed Scope - Disabled by Default)
  enableGalleryModule: false,
  enableCertificateGenerator: false,
  enableEventRegistration: false,
  enableInventoryQrLabels: false,
  enableAlumniPortal: false,
  enableMultiClubTenant: false,
  enableScheduledBackups: false,
  enableSponsorManagement: false,
});

export type FeatureFlagsConfig = typeof featureFlagsConfig;

/**
 * Application Identity & Localization Configurations
 */

import { APP_CONSTANTS } from "../constants";

export const appConfig = Object.freeze({
  name: APP_CONSTANTS.CLUB_NAME,
  organization: APP_CONSTANTS.ORGANIZATION_NAME,
  version: "1.0.0",
  timezone: APP_CONSTANTS.SYSTEM_TZ,
  locale: APP_CONSTANTS.DEFAULT_LOCALE,
  fallbackLanguage: "en",
});

export type AppConfig = typeof appConfig;

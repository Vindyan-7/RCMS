/**
 * Centralized Configuration Framework Export Interface
 */

import { env } from "./environment";
import { appConfig } from "./app";
import { academicConfig } from "./academic";
import { clubConfig } from "./club";
import { uploadConfig } from "./uploads";
import { paginationConfig } from "./pagination";
import { validationConfig } from "./validation";
import { featureFlagsConfig } from "./feature-flags";
import { defaultsConfig } from "./defaults";

export const config = Object.freeze({
  env,
  app: appConfig,
  academic: academicConfig,
  club: clubConfig,
  upload: uploadConfig,
  pagination: paginationConfig,
  validation: validationConfig,
  featureFlags: featureFlagsConfig,
  defaults: defaultsConfig,
});

export type Config = typeof config;
export { env } from "./environment";
export { appConfig } from "./app";
export { academicConfig } from "./academic";
export { clubConfig } from "./club";
export { uploadConfig } from "./uploads";
export { paginationConfig } from "./pagination";
export { validationConfig } from "./validation";
export { featureFlagsConfig } from "./feature-flags";
export { defaultsConfig } from "./defaults";

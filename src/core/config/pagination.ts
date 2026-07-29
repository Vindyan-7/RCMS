/**
 * Pagination Configurations
 */

import { PAGINATION_CONSTANTS } from "../constants";

export const paginationConfig = Object.freeze({
  defaultPage: PAGINATION_CONSTANTS.DEFAULT_PAGE,
  defaultLimit: PAGINATION_CONSTANTS.DEFAULT_LIMIT,
  maxLimit: PAGINATION_CONSTANTS.MAX_LIMIT,
  defaultOrder: PAGINATION_CONSTANTS.DEFAULT_SORT_ORDER,
});

export type PaginationConfig = typeof paginationConfig;

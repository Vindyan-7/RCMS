/**
 * RBAC Core Type Definitions
 */

import { UUID } from "../../types";

export type Role = string;
export type Permission = string;

export interface IRbacUser {
  id: UUID;
  role: Role;
  permissions: Permission[];
}

export interface IPolicyContext {
  user: IRbacUser;
  resource?: unknown;
  action?: string;
}

export type PolicyEvaluator = (context: IPolicyContext) => boolean;

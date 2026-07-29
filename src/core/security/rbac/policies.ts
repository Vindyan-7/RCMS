/**
 * Reusable Policy Evaluations
 */

import { IPolicyContext } from "./types";
import { ROLES } from "./roles";

export const POLICIES = {
  /**
   * Policy: Determines if the authenticated user matches the owner identifier of the target resource
   */
  isSelf: (context: IPolicyContext): boolean => {
    if (!context.resource || typeof context.resource !== "object") return false;
    const res = context.resource as Record<string, any>;
    return context.user.id === res.userId || context.user.id === res.id;
  },

  /**
   * Policy: Restricts action strictly to high priority root administration
   */
  isSuperAdmin: (context: IPolicyContext): boolean => {
    return context.user.role === ROLES.SUPER_ADMIN;
  },

  /**
   * Policy: Restricts action strictly to core executive members
   */
  isExecutive: (context: IPolicyContext): boolean => {
    const execRoles: string[] = [
      ROLES.SUPER_ADMIN,
      ROLES.FACULTY_ADVISOR,
      ROLES.CLUB_PRESIDENT,
      ROLES.VICE_PRESIDENT,
      ROLES.SECRETARY,
      ROLES.TREASURER,
    ];
    return execRoles.includes(context.user.role);
  },
};

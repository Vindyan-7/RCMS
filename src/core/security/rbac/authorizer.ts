/**
 * Reusable RBAC Authorizer Service
 */

import { IRbacUser, IPolicyContext, PolicyEvaluator } from "./types";
import { ROLES } from "./roles";

export class Authorizer {
  /**
   * Evaluates if the user possesses the expected role (Super Admin bypasses check)
   */
  public static hasRole(user: IRbacUser, role: string): boolean {
    if (user.role === ROLES.SUPER_ADMIN) return true;
    return user.role === role;
  }

  /**
   * Evaluates if the user possesses the expected permission (Super Admin bypasses check)
   */
  public static hasPermission(user: IRbacUser, permission: string): boolean {
    if (user.role === ROLES.SUPER_ADMIN) return true;
    return user.permissions.includes(permission);
  }

  /**
   * Evaluates custom policy logic (Super Admin bypasses check)
   */
  public static evaluatePolicy(
    policy: PolicyEvaluator,
    user: IRbacUser,
    resource?: unknown,
    action?: string
  ): boolean {
    if (user.role === ROLES.SUPER_ADMIN) return true;
    const context: IPolicyContext = { user, resource, action };
    return policy(context);
  }
}
export default Authorizer;

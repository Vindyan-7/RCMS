/**
 * Reusable Route Guards
 */

import { ISecurityContext } from "../context";
import { UnauthorizedError, ForbiddenError } from "../../errors";

export class SecurityGuards {
  /**
   * Enforces that a security context is fully authenticated
   */
  public static enforceAuthenticated(context: ISecurityContext): void {
    if (!context.isAuthenticated) {
      throw new UnauthorizedError("Authentication required to access this resource");
    }
  }

  /**
   * Enforces that a security context is NOT authenticated (guests only)
   */
  public static enforceGuest(context: ISecurityContext): void {
    if (context.isAuthenticated) {
      throw new ForbiddenError("Only unauthenticated users can access this page");
    }
  }

  /**
   * Enforces permission validation callback on current user identity
   */
  public static enforcePermission(
    context: ISecurityContext,
    validate: (user: any) => boolean
  ): void {
    this.enforceAuthenticated(context);
    
    if (!validate(context.user)) {
      throw new ForbiddenError("You lack the required privileges to execute this action");
    }
  }
}
export default SecurityGuards;

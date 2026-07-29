/**
 * Request-Scoped Security Context
 */

import { ICurrentUser } from "../auth/types";
import { ISession } from "../session/types";

export interface ISecurityContext {
  user: ICurrentUser | null;
  session: ISession | null;
  isAuthenticated: boolean;
}

export class SecurityContext implements ISecurityContext {
  constructor(
    public readonly user: ICurrentUser | null,
    public readonly session: ISession | null
  ) {}

  public get isAuthenticated(): boolean {
    return this.user !== null && this.session !== null;
  }
}
export default SecurityContext;

/**
 * Session Management Types & Interfaces
 */

import { UUID } from "../../types";

export interface ISessionMetadata {
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
}

export interface ISession {
  sessionId: UUID;
  userId: UUID;
  expiresAt: Date;
  metadata: ISessionMetadata;
}

export interface ISessionValidator {
  isValid(session: ISession): boolean;
  isExpired(session: ISession): boolean;
}

export class SessionValidator implements ISessionValidator {
  public isValid(session: ISession): boolean {
    return !!session.sessionId && !!session.userId && !this.isExpired(session);
  }

  public isExpired(session: ISession): boolean {
    return new Date() > session.expiresAt;
  }
}

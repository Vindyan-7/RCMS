/**
 * Authentication Foundation Types & Interfaces
 */

import { UUID } from "../../types";
import { UserRole } from "../../enums";

export interface ICurrentUser {
  id: UUID;
  email: string;
  role: UserRole;
  name: string;
}

export interface IAuthSessionState {
  user: ICurrentUser | null;
  accessToken: string | null;
  refreshToken: string | null;
}

export interface IAuthProvider {
  getCurrentUser(): Promise<ICurrentUser | null>;
  refreshSession(): Promise<boolean>;
  signOut(): Promise<void>;
  getSessionState(): Promise<IAuthSessionState>;
}

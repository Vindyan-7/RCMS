/**
 * Token Validation Abstractions
 */

import { UUID } from "../../types";
import { UserRole } from "../../enums";

export interface ITokenPayload {
  sub: UUID; // Subject (User ID)
  email: string;
  role: UserRole;
  exp: number; // Expiration epoch
  iss?: string; // Issuer
}

export interface ITokenValidator {
  validateToken(token: string): Promise<ITokenPayload | null>;
}

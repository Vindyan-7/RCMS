/**
 * Authentication Middleware Hook Abstractions
 */

import { ISecurityContext } from "../context";

export interface IMiddlewareChainContext {
  securityContext: ISecurityContext;
  next(): Promise<void>;
}

export type AuthenticationMiddlewareHook = (
  context: IMiddlewareChainContext
) => Promise<void>;

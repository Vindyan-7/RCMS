/**
 * Centralized Logging Framework
 */

import { env } from "../config/environment";

export type LogLevel = "debug" | "info" | "warn" | "error";

interface LogMeta {
  userId?: string;
  module?: string;
  action?: string;
  ip?: string;
  [key: string]: unknown;
}

class Logger {
  private isServer = typeof window === "undefined";
  private isProduction = env.NODE_ENV === "production";

  private shouldLog(level: LogLevel): boolean {
    if (this.isProduction) {
      // In production, debug logs are suppressed
      return level !== "debug";
    }
    return true;
  }

  private formatMessage(level: LogLevel, message: string, meta?: LogMeta): string {
    const timestamp = new Date().toISOString();
    const context = this.isServer ? "SERVER" : "CLIENT";
    const metaString = meta ? ` | Meta: ${JSON.stringify(meta)}` : "";
    return `[${timestamp}] [${level.toUpperCase()}] [${context}] ${message}${metaString}`;
  }

  public debug(message: string, meta?: LogMeta): void {
    if (!this.shouldLog("debug")) return;
    console.debug(this.formatMessage("debug", message, meta));
  }

  public info(message: string, meta?: LogMeta): void {
    if (!this.shouldLog("info")) return;
    console.info(this.formatMessage("info", message, meta));
  }

  public warn(message: string, meta?: LogMeta): void {
    if (!this.shouldLog("warn")) return;
    console.warn(this.formatMessage("warn", message, meta));
  }

  public error(message: string, error?: unknown, meta?: LogMeta): void {
    if (!this.shouldLog("error")) return;
    
    let errorDetails: any = {};
    if (error instanceof Error) {
      errorDetails = {
        name: error.name,
        message: error.message,
        stack: this.isProduction ? undefined : error.stack,
      };
    } else if (error) {
      errorDetails = { raw: error };
    }

    const combinedMeta = {
      ...meta,
      error: errorDetails,
    };

    console.error(this.formatMessage("error", message, combinedMeta));
  }
}

export const logger = new Logger();
export default logger;

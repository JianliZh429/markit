/**
 * Centralized Logging Framework
 * Replaces console.log statements with structured logging
 */

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  NONE = 4,
}

export class Logger {
  private static instance: Logger;
  private logLevel: LogLevel = LogLevel.INFO;
  private enableFileLogging: boolean = false;
  private logBuffer: string[] = [];
  private maxBufferSize: number = 1000;

  private constructor() {
    // Private constructor for singleton
  }

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  setFileLogging(enabled: boolean): void {
    this.enableFileLogging = enabled;
  }

  private log(
    level: LogLevel,
    category: string,
    message: string,
    ...args: any[]
  ): void {
    if (level < this.logLevel) {
      return;
    }

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const formattedMessage = `[${timestamp}] [${levelName}] [${category}] ${message}`;

    // Console output with appropriate method
    switch (level) {
      case LogLevel.DEBUG:
      case LogLevel.INFO:
        console.log(formattedMessage, ...args);
        break;
      case LogLevel.WARN:
        console.warn(formattedMessage, ...args);
        break;
      case LogLevel.ERROR:
        console.error(formattedMessage, ...args);
        break;
    }

    // Buffer for file logging
    if (this.enableFileLogging) {
      this.logBuffer.push(formattedMessage);
      if (this.logBuffer.length > this.maxBufferSize) {
        this.logBuffer.shift();
      }
    }
  }

  debug(category: string, message: string, ...args: any[]): void {
    this.log(LogLevel.DEBUG, category, message, ...args);
  }

  info(category: string, message: string, ...args: any[]): void {
    this.log(LogLevel.INFO, category, message, ...args);
  }

  warn(category: string, message: string, ...args: any[]): void {
    this.log(LogLevel.WARN, category, message, ...args);
  }

  error(category: string, message: string, ...args: any[]): void {
    this.log(LogLevel.ERROR, category, message, ...args);
  }

  getLogBuffer(): string[] {
    return [...this.logBuffer];
  }

  clearBuffer(): void {
    this.logBuffer = [];
  }
}

// Export singleton instance
export const logger = Logger.getInstance();

// Convenience functions for common categories
export const fileLogger = {
  debug: (msg: string, ...args: any[]) => logger.debug("FILE", msg, ...args),
  info: (msg: string, ...args: any[]) => logger.info("FILE", msg, ...args),
  warn: (msg: string, ...args: any[]) => logger.warn("FILE", msg, ...args),
  error: (msg: string, ...args: any[]) => logger.error("FILE", msg, ...args),
};

export const searchLogger = {
  debug: (msg: string, ...args: any[]) => logger.debug("SEARCH", msg, ...args),
  info: (msg: string, ...args: any[]) => logger.info("SEARCH", msg, ...args),
  warn: (msg: string, ...args: any[]) => logger.warn("SEARCH", msg, ...args),
  error: (msg: string, ...args: any[]) => logger.error("SEARCH", msg, ...args),
};

export const menuLogger = {
  debug: (msg: string, ...args: any[]) => logger.debug("MENU", msg, ...args),
  info: (msg: string, ...args: any[]) => logger.info("MENU", msg, ...args),
  warn: (msg: string, ...args: any[]) => logger.warn("MENU", msg, ...args),
  error: (msg: string, ...args: any[]) => logger.error("MENU", msg, ...args),
};

export const ipcLogger = {
  debug: (msg: string, ...args: any[]) => logger.debug("IPC", msg, ...args),
  info: (msg: string, ...args: any[]) => logger.info("IPC", msg, ...args),
  warn: (msg: string, ...args: any[]) => logger.warn("IPC", msg, ...args),
  error: (msg: string, ...args: any[]) => logger.error("IPC", msg, ...args),
};

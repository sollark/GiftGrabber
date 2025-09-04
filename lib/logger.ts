/**
 * Enhanced Logger with File Writing Capabilities
 *
 * This module provides a comprehensive logging solution that works across different environments:
 * - Browser + Development: Console logging with styling
 * - Server-side: File logging with rotation, cleanup, and structured JSON format
 * - Production: Optimized logging with minimal overhead
 *
 * Features:
 * - Automatic log file rotation (5MB max size)
 * - Cleanup of old log files (10 files max)
 * - Structured JSON logging with timestamps
 * - Multiple log levels (log, info, warn, error, important)
 * - Environment-aware logging behavior
 * - Async flush capability for ensuring log persistence
 *
 * @fileoverview Cross-platform logger with file writing, rotation, and cleanup
 * @author System
 * @version 2.0.0
 */

// Environment detection
const isBrowser = typeof window !== "undefined";
const isServer = typeof window === "undefined";
const isDev = process.env.NODE_ENV === "development";

// Conditional imports for server-side only
let fs: any = null;
let path: any = null;

if (isServer) {
  try {
    fs = require("fs").promises;
    path = require("path");
  } catch (error) {
    console.warn("Failed to load fs/path modules for file logging:", error);
  }
}

// Log configuration
const LOG_CONFIG = {
  // Directory for log files (relative to project root)
  LOG_DIR: "logs",
  // Maximum log file size before rotation (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,
  // Maximum number of log files to keep
  MAX_FILES: 10,
  // Log file names by level
  FILES: {
    ALL: "app.log",
    ERROR: "error.log",
    IMPORTANT: "important.log",
  },
} as const;

/**
 * Log entry structure for file logging
 */
interface LogEntry {
  timestamp: string;
  level: string;
  message: string;
  data?: unknown[];
}

// Logger interface for type safety
/**
 * Logger interface with console and file logging capabilities
 * Supports structured logging with different levels and async operations
 */
interface Logger {
  log: (...args: any[]) => void;
  info: (...args: any[]) => void;
  warn: (...args: any[]) => void;
  error: (...args: any[]) => void;
  important: (...args: any[]) => void;
  flush: () => Promise<void>;
}

/**
 * File logging utilities (server-side only)
 */
class FileLogger {
  private logDir: string;

  constructor() {
    this.logDir = path.join(process.cwd(), LOG_CONFIG.LOG_DIR);
    this.ensureLogDirectory();
  }

  /**
   * Ensures the log directory exists
   */
  private async ensureLogDirectory(): Promise<void> {
    try {
      await fs.mkdir(this.logDir, { recursive: true });
    } catch (error) {
      // Directory might already exist, ignore error
    }
  }

  /**
   * Formats a log entry for file writing
   */
  private formatLogEntry(level: string, args: unknown[]): string {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level: level.toUpperCase(),
      message: args
        .map((arg) =>
          typeof arg === "object" ? JSON.stringify(arg, null, 2) : String(arg)
        )
        .join(" "),
    };

    return JSON.stringify(entry) + "\n";
  }

  /**
   * Gets file stats safely
   */
  private async getFileSize(filePath: string): Promise<number> {
    try {
      const stats = await fs.stat(filePath);
      return stats.size;
    } catch {
      return 0;
    }
  }

  /**
   * Rotates log file if it exceeds maximum size
   */
  private async rotateLogFile(filePath: string): Promise<void> {
    try {
      const size = await this.getFileSize(filePath);
      if (size > LOG_CONFIG.MAX_FILE_SIZE) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        const rotatedPath = filePath.replace(".log", `-${timestamp}.log`);
        await fs.rename(filePath, rotatedPath);

        // Clean up old log files
        await this.cleanupOldLogs(path.dirname(filePath));
      }
    } catch (error) {
      // Rotation failed, continue with current file
      console.error("Log rotation failed:", error);
    }
  }

  /**
   * Removes old log files beyond the maximum count
   */
  private async cleanupOldLogs(logDir: string): Promise<void> {
    try {
      const files = await fs.readdir(logDir);
      const logFiles = files
        .filter((file: string) => file.endsWith(".log"))
        .map((file: string) => ({
          name: file,
          path: path.join(logDir, file),
          time: fs
            .stat(path.join(logDir, file))
            .then((stats: any) => stats.mtime),
        }));

      const fileStats = await Promise.all(
        logFiles.map(async (file: any) => ({
          ...file,
          time: await file.time,
        }))
      );

      // Sort by modification time (newest first)
      fileStats.sort((a: any, b: any) => b.time.getTime() - a.time.getTime());

      // Remove files beyond max count
      const filesToDelete = fileStats.slice(LOG_CONFIG.MAX_FILES);
      await Promise.all(
        filesToDelete.map((file: any) => fs.unlink(file.path).catch(() => {}))
      );
    } catch (error) {
      // Cleanup failed, continue
      console.error("Log cleanup failed:", error);
    }
  }

  /**
   * Writes log entry to specified file
   */
  public async writeToFile(
    fileName: string,
    level: string,
    args: unknown[]
  ): Promise<void> {
    if (!isServer) return;

    try {
      await this.ensureLogDirectory();
      const filePath = path.join(this.logDir, fileName);

      // Rotate if necessary
      await this.rotateLogFile(filePath);

      // Write log entry
      const logEntry = this.formatLogEntry(level, args);
      await fs.appendFile(filePath, logEntry);
    } catch (error) {
      // File logging failed, continue without throwing
      console.error("File logging failed:", error);
    }
  }

  /**
   * Writes to multiple log files
   */
  public async writeToMultipleFiles(
    fileNames: string[],
    level: string,
    args: unknown[]
  ): Promise<void> {
    await Promise.all(
      fileNames.map((fileName) => this.writeToFile(fileName, level, args))
    );
  }

  /**
   * Flushes any pending writes (no-op for fs.appendFile)
   */
  public async flush(): Promise<void> {
    // fs.appendFile automatically flushes, but we can ensure directory exists
    await this.ensureLogDirectory();
  }
}

/**
 * Enhanced factory function to create a logger with file writing capabilities.
 * Logs to console in browser/dev mode and to files on server-side.
 * @returns {Logger} Logger instance with hybrid console/file logging
 */
function createLogger(): Logger {
  const fileLogger = isServer ? new FileLogger() : null;

  // Browser + development: console logging with optional file logging
  if (isBrowser && isDev) {
    return {
      log: (...args) => {
        console.log("[LOG]", ...args);
      },
      info: (...args) => {
        console.info("[INFO]", ...args);
      },
      warn: (...args) => {
        console.warn("[WARN]", ...args);
      },
      error: (...args) => {
        console.error("[ERROR]", ...args);
      },
      important: (...args) => {
        if (args.length > 0) {
          const [first, ...rest] = args;
          console.log("%c[IMPORTANT]", "font-weight:bold;", first, ...rest);
        } else {
          console.log("%c[IMPORTANT]", "font-weight:bold;");
        }
      },
      flush: async () => {
        // No-op in browser
      },
    };
  }

  // Server-side: file logging with optional console logging
  if (isServer) {
    const shouldLogToConsole = isDev;

    return {
      log: (...args) => {
        if (shouldLogToConsole) console.log("[LOG]", ...args);
        fileLogger?.writeToFile(LOG_CONFIG.FILES.ALL, "log", args);
      },
      info: (...args) => {
        if (shouldLogToConsole) console.info("[INFO]", ...args);
        fileLogger?.writeToFile(LOG_CONFIG.FILES.ALL, "info", args);
      },
      warn: (...args) => {
        if (shouldLogToConsole) console.warn("[WARN]", ...args);
        fileLogger?.writeToFile(LOG_CONFIG.FILES.ALL, "warn", args);
      },
      error: (...args) => {
        if (shouldLogToConsole) console.error("[ERROR]", ...args);
        // Write to both general log and error-specific log
        fileLogger?.writeToMultipleFiles(
          [LOG_CONFIG.FILES.ALL, LOG_CONFIG.FILES.ERROR],
          "error",
          args
        );
      },
      important: (...args) => {
        if (shouldLogToConsole) {
          if (args.length > 0) {
            const [first, ...rest] = args;
            console.log("%c[IMPORTANT]", "font-weight:bold;", first, ...rest);
          } else {
            console.log("%c[IMPORTANT]", "font-weight:bold;");
          }
        }
        // Write to both general log and important-specific log
        fileLogger?.writeToMultipleFiles(
          [LOG_CONFIG.FILES.ALL, LOG_CONFIG.FILES.IMPORTANT],
          "important",
          args
        );
      },
      flush: async () => {
        await fileLogger?.flush();
      },
    };
  }

  // Production browser or unknown environment: no-ops
  return {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
    important: () => {},
    flush: async () => {},
  };
}

const logger: Logger = createLogger();
export default logger;

/**
 * ClientLogger - A type-safe logger for client-side development.
 *
 * Only prints to the console if running in the browser and NODE_ENV is 'development'.
 * Reads environment from process.env.NODE_ENV (Next.js exposes this at build time).
 *
 * Usage:
 *   import logger from '@/lib/logger';
 *   logger.log('Hello');
 *   logger.error('Oops!');
 */

// Utility to check if running in browser
// @returns {boolean} True if running in browser
const isBrowser = typeof window !== "undefined";
// Utility to check if in development mode
// @returns {boolean} True if NODE_ENV is 'development'
const isDev = process.env.NODE_ENV === "development";

// Logger interface for type safety
/**
 * Logger interface for type-safe logging methods.
 * @property log - Standard log method
 * @property info - Info log method
 * @property warn - Warning log method
 * @property error - Error log method
 */
interface Logger {
  log: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
}

/**
 * Factory function to create a logger.
 * Only logs in browser and dev mode, otherwise no-ops.
 * @returns {Logger} Logger instance
 */
function createLogger(): Logger {
  console.log("🚀 CREATING LOGGER:", { isBrowser, isDev });

  // Only log in browser and dev mode
  if (isBrowser && isDev) {
    console.log("✅ LOGGER: Creating active logger");
    return {
      log: (...args) => console.log("[LOG]", ...args),
      info: (...args) => console.info("[INFO]", ...args),
      warn: (...args) => console.warn("[WARN]", ...args),
      error: (...args) => console.error("[ERROR]", ...args),
    };
  }
  // No-ops in production or server
  return {
    log: () => {},
    info: () => {},
    warn: () => {},
    error: () => {},
  };
}

const logger: Logger = createLogger();
export default logger;

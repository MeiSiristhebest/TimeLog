/**
 * Development-aware logging utility.
 * Only logs in development mode to prevent sensitive data exposure in production.
 *
 * Usage:
 *   import { devLog } from '@/lib/devLogger';
 *   devLog.info('[Module] Message', data);
 *   devLog.warn('[Module] Warning', data);
 *   devLog.error('[Module] Error', error); // Always logs errors
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface DevLogger {
  debug: (...args: unknown[]) => void;
  info: (...args: unknown[]) => void;
  warn: (...args: unknown[]) => void;
  error: (...args: unknown[]) => void;
  log: (level: LogLevel, ...args: unknown[]) => void;
}

const noop = () => {};

/**
 * Development logger that only outputs in __DEV__ mode.
 * Errors are always logged regardless of environment.
 */
export const devLog: DevLogger = {
  debug: __DEV__ ? console.debug.bind(console) : noop,
  info: __DEV__ ? console.log.bind(console) : noop,
  warn: __DEV__ ? console.warn.bind(console) : noop,
  // Errors always logged (but consider sending to Sentry in production)
  error: console.error.bind(console),
  log: (level: LogLevel, ...args: unknown[]) => {
    if (level === 'error') {
      console.error(...args);
    } else if (__DEV__) {
      console[level === 'info' ? 'log' : level](...args);
    }
  },
};

export default devLog;

type LogLevel = "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

const writeLog = (level: LogLevel, message: string, meta: LogMeta = {}) => {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    }),
  );
};

export const logger = {
  error: (message: string, meta?: LogMeta) => writeLog("error", message, meta),
  info: (message: string, meta?: LogMeta) => writeLog("info", message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog("warn", message, meta),
};

type LogLevel = "info" | "warn" | "error";
type LogMeta = Record<string, unknown>;

type LogFormat = "json" | "pretty";

const COLOR_RESET = "\u001b[0m";
const LEVEL_COLORS: Record<LogLevel, string> = {
  info: "\u001b[36m",
  warn: "\u001b[33m",
  error: "\u001b[31m",
};

const resolveLogFormat = (): LogFormat => {
  const configured = process.env.LOG_FORMAT?.trim().toLowerCase();

  if (configured === "json" || configured === "pretty") {
    return configured;
  }

  return process.stdout.isTTY && process.env.NODE_ENV !== "production" ? "pretty" : "json";
};

const formatPrettyMeta = (meta: LogMeta) => {
  const entries = Object.entries(meta).filter(([, value]) => value !== undefined);

  if (entries.length === 0) {
    return "";
  }

  return entries
    .map(([key, value]) => {
      if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
        return `${key}=${value}`;
      }

      return `${key}=${JSON.stringify(value)}`;
    })
    .join(" ");
};

const writePrettyLog = (level: LogLevel, message: string, meta: LogMeta) => {
  const timestamp = new Date().toISOString();
  const color = process.stdout.isTTY ? LEVEL_COLORS[level] : "";
  const reset = process.stdout.isTTY ? COLOR_RESET : "";
  const prettyMeta = formatPrettyMeta(meta);
  const line = [`[${timestamp}]`, `${color}${level.toUpperCase()}${reset}`, message, prettyMeta]
    .filter((part) => part.length > 0)
    .join(" ");

  console.log(line);
};

const writeJsonLog = (level: LogLevel, message: string, meta: LogMeta) => {
  console.log(
    JSON.stringify({
      level,
      message,
      timestamp: new Date().toISOString(),
      ...meta,
    }),
  );
};

const writeLog = (level: LogLevel, message: string, meta: LogMeta = {}) => {
  if (resolveLogFormat() === "pretty") {
    writePrettyLog(level, message, meta);
    return;
  }

  writeJsonLog(level, message, meta);
};

export const logger = {
  error: (message: string, meta?: LogMeta) => writeLog("error", message, meta),
  info: (message: string, meta?: LogMeta) => writeLog("info", message, meta),
  warn: (message: string, meta?: LogMeta) => writeLog("warn", message, meta),
};

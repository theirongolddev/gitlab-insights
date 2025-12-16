import pino from "pino";

const isProduction = process.env.NODE_ENV === "production";

// Sensitive fields that should be redacted from logs
const REDACT_PATHS = [
  "error.config.headers.Authorization",
  "error.config.headers.authorization",
  "error.request.headers.Authorization",
  "error.request.headers.authorization",
  "error.response.config.headers.Authorization",
  "error.response.config.headers.authorization",
  "*.accessToken",
  "*.access_token",
  "*.refreshToken",
  "*.refresh_token",
  "*.token",
  "*.secret",
  "*.password",
  "*.apiKey",
  "*.api_key",
  "headers.Authorization",
  "headers.authorization",
];

export const logger = pino({
  level: isProduction ? "info" : "debug",
  redact: {
    paths: REDACT_PATHS,
    censor: "[REDACTED]",
  },
  transport: isProduction
    ? undefined
    : {
        target: "pino-pretty",
        options: {
          colorize: true,
          ignore: "pid,hostname",
          translateTime: "SYS:standard",
        },
      },
});

export type Logger = typeof logger;

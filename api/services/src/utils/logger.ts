import winston from 'winston';
import path from 'path';

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4,
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white',
};

// Tell winston about the colors
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`,
  ),
);

// Define which transports the logger must use
const transports = [
  // Console output
  new winston.transports.Console(),
  // Error logs file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'error.log'),
    level: 'error',
  }),
  // All logs file
  new winston.transports.File({
    filename: path.join(process.cwd(), 'logs', 'all.log'),
  }),
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
});

// Create specialized loggers for different modules
export const createModuleLogger = (module: string) => {
  return {
    error: (message: string, meta?: any) => logger.error(`[${module}] ${message}`, meta),
    warn: (message: string, meta?: any) => logger.warn(`[${module}] ${message}`, meta),
    info: (message: string, meta?: any) => logger.info(`[${module}] ${message}`, meta),
    http: (message: string, meta?: any) => logger.http(`[${module}] ${message}`, meta),
    debug: (message: string, meta?: any) => logger.debug(`[${module}] ${message}`, meta),
  };
};

export default logger;

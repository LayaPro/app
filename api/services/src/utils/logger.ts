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

// Specialized transport for cron jobs
const cronJobsTransport = new winston.transports.File({
  filename: path.join(process.cwd(), 'logs', 'cronJobs.log'),
});

// Specialized transport for images (ImageController)
const imagesTransport = new winston.transports.File({
  filename: path.join(process.cwd(), 'logs', 'images.log'),
});

// Create the logger
const logger = winston.createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  levels,
  format,
  transports,
});

// Create specialized loggers for different modules
export const createModuleLogger = (module: string) => {
  // Determine if this is a cron job module
  const isCronJob = module.includes('Cron') || module.includes('Job') || module.includes('Updater') || module.includes('Checker');
  
  // Create module-specific logger
  const moduleLogger = winston.createLogger({
    level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
    levels,
    format,
    transports: isCronJob 
      ? [...transports, cronJobsTransport] 
      : module === 'ImageController' 
        ? [...transports, imagesTransport]
        : transports,
  });

  return {
    error: (message: string, meta?: any) => moduleLogger.error(`[${module}] ${message}`, meta),
    warn: (message: string, meta?: any) => moduleLogger.warn(`[${module}] ${message}`, meta),
    info: (message: string, meta?: any) => moduleLogger.info(`[${module}] ${message}`, meta),
    http: (message: string, meta?: any) => moduleLogger.http(`[${module}] ${message}`, meta),
    debug: (message: string, meta?: any) => moduleLogger.debug(`[${module}] ${message}`, meta),
  };
};

export default logger;

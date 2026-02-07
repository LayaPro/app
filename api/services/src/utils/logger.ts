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

// Define module logger type
interface ModuleLogger {
  error: (message: string, meta?: any) => void;
  warn: (message: string, meta?: any) => void;
  info: (message: string, meta?: any) => void;
  http: (message: string, meta?: any) => void;
  debug: (message: string, meta?: any) => void;
}

// Cache for module loggers to prevent creating duplicates
const moduleLoggers = new Map<string, ModuleLogger>();

// Create specialized loggers for different modules
export const createModuleLogger = (module: string): ModuleLogger => {
  // Return cached logger if it exists
  if (moduleLoggers.has(module)) {
    return moduleLoggers.get(module)!;
  }

  // Determine if this is a cron job module
  const isCronJob = module.includes('Cron') || module.includes('Job') || module.includes('Updater') || module.includes('Checker');
  
  // Determine additional transports for this module
  const additionalTransports: winston.transport[] = [];
  if (isCronJob) {
    additionalTransports.push(cronJobsTransport);
  } else if (module === 'ImageController') {
    additionalTransports.push(imagesTransport);
  }

  // Create module-specific logger only if it needs additional transports
  let moduleLogger: winston.Logger;
  if (additionalTransports.length > 0) {
    moduleLogger = winston.createLogger({
      level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
      levels,
      format,
      transports: [...transports, ...additionalTransports],
    });
  } else {
    // Reuse base logger for modules without special transports
    moduleLogger = logger;
  }

  const loggerInstance: ModuleLogger = {
    error: (message: string, meta?: any) => moduleLogger.error(`[${module}] ${message}`, meta),
    warn: (message: string, meta?: any) => moduleLogger.warn(`[${module}] ${message}`, meta),
    info: (message: string, meta?: any) => moduleLogger.info(`[${module}] ${message}`, meta),
    http: (message: string, meta?: any) => moduleLogger.http(`[${module}] ${message}`, meta),
    debug: (message: string, meta?: any) => moduleLogger.debug(`[${module}] ${message}`, meta),
  };

  // Cache the logger instance
  moduleLoggers.set(module, loggerInstance);
  
  return loggerInstance;
};

export default logger;

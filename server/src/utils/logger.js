const winston = require('winston');

const { combine, timestamp, json, colorize, simple, errors } = winston.format;

const isDev = process.env.NODE_ENV !== 'production';

const logger = winston.createLogger({
  level: isDev ? 'debug' : 'info',
  format: isDev
    ? combine(colorize(), timestamp({ format: 'HH:mm:ss' }), errors({ stack: true }), simple())
    : combine(timestamp(), errors({ stack: true }), json()),
  transports: [
    new winston.transports.Console(),
    ...(isDev
      ? []
      : [
          new winston.transports.File({ filename: 'logs/error.log', level: 'error' }),
          new winston.transports.File({ filename: 'logs/combined.log' }),
        ]),
  ],
  exitOnError: false,
});

module.exports = logger;

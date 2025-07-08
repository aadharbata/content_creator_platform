"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbLogger = exports.messageLogger = exports.authLogger = exports.socketLogger = exports.createContextLogger = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const logLevel = process.env.LOG_LEVEL || 'info';
const logFormat = winston_1.default.format.combine(winston_1.default.format.timestamp({
    format: 'YYYY-MM-DD HH:mm:ss'
}), winston_1.default.format.errors({ stack: true }), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    let logMessage = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (stack) {
        logMessage += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
        logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
}));
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({
    format: 'HH:mm:ss'
}), winston_1.default.format.printf((info) => {
    const { timestamp, level, message, stack, ...meta } = info;
    let logMessage = `${timestamp} ${level}: ${message}`;
    if (stack) {
        logMessage += `\n${stack}`;
    }
    if (Object.keys(meta).length > 0) {
        logMessage += `\n${JSON.stringify(meta, null, 2)}`;
    }
    return logMessage;
}));
const transports = [
    new winston_1.default.transports.Console({
        format: process.env.NODE_ENV === 'production' ? logFormat : consoleFormat
    })
];
if (process.env.NODE_ENV === 'production') {
    transports.push(new winston_1.default.transports.File({
        filename: 'logs/error.log',
        level: 'error',
        format: logFormat,
        maxsize: 5242880,
        maxFiles: 5
    }), new winston_1.default.transports.File({
        filename: 'logs/combined.log',
        format: logFormat,
        maxsize: 5242880,
        maxFiles: 5
    }));
}
exports.logger = winston_1.default.createLogger({
    level: logLevel,
    format: logFormat,
    transports,
    exceptionHandlers: [
        new winston_1.default.transports.File({ filename: 'logs/exceptions.log' })
    ],
    rejectionHandlers: [
        new winston_1.default.transports.File({ filename: 'logs/rejections.log' })
    ]
});
const createContextLogger = (context) => {
    return {
        info: (message, meta) => exports.logger.info(`[${context}] ${message}`, meta),
        warn: (message, meta) => exports.logger.warn(`[${context}] ${message}`, meta),
        error: (message, meta) => exports.logger.error(`[${context}] ${message}`, meta),
        debug: (message, meta) => exports.logger.debug(`[${context}] ${message}`, meta)
    };
};
exports.createContextLogger = createContextLogger;
exports.socketLogger = (0, exports.createContextLogger)('SOCKET');
exports.authLogger = (0, exports.createContextLogger)('AUTH');
exports.messageLogger = (0, exports.createContextLogger)('MESSAGE');
exports.dbLogger = (0, exports.createContextLogger)('DATABASE');
process.on('uncaughtException', (error) => {
    exports.logger.error('Uncaught Exception:', error);
    process.exit(1);
});
process.on('unhandledRejection', (reason, promise) => {
    exports.logger.error('Unhandled Rejection at:', { promise, reason });
    process.exit(1);
});
//# sourceMappingURL=logger.js.map
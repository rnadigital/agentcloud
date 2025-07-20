import pino from 'pino';
import chalk from 'chalk';

const namespaceColorMap = new Map();

// Predefined colors that work well on both light and dark terminals
const terminalColors = [
	'#FF6B6B', // Red
	'#4ECDC4', // Teal
	'#45B7D1', // Blue
	'#96CEB4', // Green
	'#FFEAA7', // Yellow
	'#DDA0DD', // Plum
	'#98D8C8', // Mint
	'#F7DC6F', // Gold
	'#BB8FCE', // Lavender
	'#85C1E9', // Sky Blue
	'#F8C471', // Orange
	'#82E0AA', // Light Green
	'#F1948A', // Salmon
	'#85C1E9', // Light Blue
	'#D7BDE2', // Light Purple
	'#FAD7A0' // Peach
];

function hashNamespaceToColor(namespace: string): string {
	// Deterministic hash to select from predefined colors
	const hash = [...namespace].reduce((acc, c) => acc + c.charCodeAt(0), 0);
	const colorIndex = hash % terminalColors.length;
	return terminalColors[colorIndex];
}

function getColorFn(namespace: string) {
	if (namespaceColorMap.has(namespace)) {
		return namespaceColorMap.get(namespace);
	}

	const color = hashNamespaceToColor(namespace);
	const fn = chalk.hex(color);
	namespaceColorMap.set(namespace, fn);
	return fn;
}

// Create the main Pino logger instance
const pinoLogger = pino({
	level: process.env.LOG_LEVEL || 'info',
	transport:
		process.env.NODE_ENV !== 'production'
			? {
					target: 'pino-pretty',
					options: {
						colorize: true,
						translateTime: false,
						ignore: 'pid,hostname,time'
					}
				}
			: undefined
});

// Create a logger that provides Pino levels
export const createLogger = (namespace: string) => {
	const colorFn = getColorFn(namespace);

	return {
		error: (message: string, ...meta: any[]) => {
			pinoLogger.error(`${colorFn(namespace)} ${message}`, { ...meta });
		},
		warn: (message: string, ...meta: any[]) => {
			pinoLogger.warn(`${colorFn(namespace)} ${message}`, { ...meta });
		},
		info: (message: string, ...meta: any[]) => {
			pinoLogger.info(`${colorFn(namespace)} ${message}`, { ...meta });
		},
		debug: (message: string, ...meta: any[]) => {
			pinoLogger.debug(`${colorFn(namespace)} ${message}`, { ...meta });
		},
		verbose: (message: string, ...meta: any[]) => {
			pinoLogger.trace(`${colorFn(namespace)} ${message}`, { ...meta });
		}
	};
};

// Global logger instance
export const logger = {
	error: (message: string, ...meta: any[]) => pinoLogger.error({ ...meta }, message),
	warn: (message: string, ...meta: any[]) => pinoLogger.warn({ ...meta }, message),
	info: (message: string, ...meta: any[]) => pinoLogger.info({ ...meta }, message),
	debug: (message: string, ...meta: any[]) => pinoLogger.debug({ ...meta }, message),
	verbose: (message: string, ...meta: any[]) => pinoLogger.trace({ ...meta }, message)
};

// Export Pino logger for direct access if needed
export { pinoLogger as pino };

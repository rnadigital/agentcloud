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

// Create a lazy-loaded Pino logger instance
let pinoLogger: any = null;
let pinoModule: any = null;

async function getPinoLogger() {
	if (typeof window !== 'undefined') {
		// Return a no-op logger for browser environments
		return {
			error: () => {},
			warn: () => {},
			info: () => {},
			debug: () => {},
			trace: () => {}
		};
	}

	if (!pinoLogger) {
		try {
			pinoModule = await import('pino');
			pinoLogger = pinoModule.default({
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
		} catch (error) {
			console.error('Failed to load Pino logger:', error);
			// Fallback to console logger
			return {
				error: (msg: string, meta?: any) => console.error(msg, meta),
				warn: (msg: string, meta?: any) => console.warn(msg, meta),
				info: (msg: string, meta?: any) => console.info(msg, meta),
				debug: (msg: string, meta?: any) => console.debug(msg, meta),
				trace: (msg: string, meta?: any) => console.trace(msg, meta)
			};
		}
	}
	return pinoLogger;
}

// Create a logger that provides Pino levels
export const createLogger = (namespace: string) => {
	const colorFn = getColorFn(namespace);

	return {
		error: async (message: string, ...meta: any[]) => {
			const logger = await getPinoLogger();
			logger.error(`${colorFn(namespace)} ${message}`, { ...meta });
		},
		warn: async (message: string, ...meta: any[]) => {
			const logger = await getPinoLogger();
			logger.warn(`${colorFn(namespace)} ${message}`, { ...meta });
		},
		info: async (message: string, ...meta: any[]) => {
			const logger = await getPinoLogger();
			logger.info(`${colorFn(namespace)} ${message}`, { ...meta });
		},
		debug: async (message: string, ...meta: any[]) => {
			const logger = await getPinoLogger();
			logger.debug(`${colorFn(namespace)} ${message}`, { ...meta });
		},
		verbose: async (message: string, ...meta: any[]) => {
			const logger = await getPinoLogger();
			logger.trace(`${colorFn(namespace)} ${message}`, { ...meta });
		}
	};
};

// Global logger instance
export const logger = {
	error: async (message: string, ...meta: any[]) => {
		const logger = await getPinoLogger();
		logger.error({ ...meta }, message);
	},
	warn: async (message: string, ...meta: any[]) => {
		const logger = await getPinoLogger();
		logger.warn({ ...meta }, message);
	},
	info: async (message: string, ...meta: any[]) => {
		const logger = await getPinoLogger();
		logger.info({ ...meta }, message);
	},
	debug: async (message: string, ...meta: any[]) => {
		const logger = await getPinoLogger();
		logger.debug({ ...meta }, message);
	},
	verbose: async (message: string, ...meta: any[]) => {
		const logger = await getPinoLogger();
		logger.trace({ ...meta }, message);
	}
};

// Export Pino logger for direct access if needed
export const getPino = async () => {
	return await getPinoLogger();
};

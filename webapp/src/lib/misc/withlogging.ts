import { addLog } from 'db/auditlog';
import debug from 'debug';
const log = debug('webapp:auditlogs');

function withLogging<T extends Array<any>, U>(
	func: (...args: T) => Promise<U>,
	userId: string
): (...funcArgs: T) => Promise<U> {
	return async (...args: T): Promise<U> => {
		const startTime = new Date();
		try {
			// Log before calling the original function
			await addLog({
				userId,
				startTime,
				functionName: func.name,
				arguments: args
			});
			const result = await func(...args);
			log(`[${new Date().toISOString()}] User ${userId} completed ${func.name} successfully.`);
			return result;
		} catch (error) {
			console.error(`Error in ${func.name} for user ${userId}:`, error);
			throw error;
		}
	};
}

export default withLogging;

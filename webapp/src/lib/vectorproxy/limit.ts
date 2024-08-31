import debug from 'debug';
import VectorDBProxyClient from 'lib/vectorproxy/client';
import { pricingMatrix } from 'struct/billing';

const log = debug('lib:vectorproxy:limit');

export async function isVectorLimitReached(resourceSlug, currentPlan) {
	try {
		// Retrieve the current vector storage for the team
		const teamVectorStorage = await VectorDBProxyClient.getVectorStorageForTeam(resourceSlug);
		const storageVectorCount = teamVectorStorage?.data?.total_points;

		log('current team vector storage count:', storageVectorCount);

		// Retrieve the plan limits
		const planLimits = pricingMatrix[currentPlan];
		if (planLimits) {
			// Calculate the approximate vector count limit based on the plan's max storage
			const approxVectorCountLimit = Math.floor(
				planLimits.maxVectorStorageBytes / (1536 * (32 / 8))
			); // Note: this is approximate

			log('plan approx. max vector count:', approxVectorCountLimit);

			// Check if the storage vector count has reached or exceeded the limit
			if (storageVectorCount >= approxVectorCountLimit) {
				return true; // Limit reached
			}
		}
		return false; // Limit not reached
	} catch (error) {
		log('Error checking vector limit:', error);
		return false; // In case of error, assume limit is not reached
	}
}

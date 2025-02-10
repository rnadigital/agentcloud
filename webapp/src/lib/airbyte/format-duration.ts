/**
 * Converts an ISO 8601 duration string to a human-readable format.
 * @param {string} duration - The ISO 8601 duration string (e.g., "PT57S").
 * @returns {string} - A human-readable duration string (e.g., "57 seconds").
 */
export function formatDuration(duration) {
	const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
	const matches = duration.match(regex);

	if (!matches) {
		return 'Invalid duration';
	}

	const hours = matches[1] ? `${matches[1]} hour${matches[1] > 1 ? 's' : ''}` : '';
	const minutes = matches[2] ? `${matches[2]} minute${matches[2] > 1 ? 's' : ''}` : '';
	const seconds = matches[3] ? `${matches[3]} second${matches[3] > 1 ? 's' : ''}` : '';

	// Combine the parts and filter out any empty strings
	const parts = [hours, minutes, seconds].filter(Boolean);
	return parts.join(', ') || '0 seconds';
}

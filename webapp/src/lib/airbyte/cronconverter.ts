export function convertCronToQuartz(cronExpression: string): string {
	const parts: string[] = cronExpression.trim().split(/\s+/);

	if (parts.length !== 5) {
		throw new Error('Invalid cron expression. Expected 5 parts.');
	}

	const [minutes, hours, dayOfMonth, month, dayOfWeek] = parts;

	// Add seconds field at the beginning
	let quartzCron: string = `0 ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;

	// Adjust day fields if both are specified
	if (dayOfMonth === '*' && dayOfWeek === '*') {
		quartzCron = `0 ${minutes} ${hours} ? ${month} ${dayOfWeek}`;
	}

	return quartzCron;
}

export function convertQuartzToCron(cronExpression: string): string {
	let splitOriginalCronExpression = cronExpression.split(/\s+/);
	if (splitOriginalCronExpression.length > 5) {
		splitOriginalCronExpression = splitOriginalCronExpression.slice(1); //Remove the leading 0 for "seconds"
	}
	return splitOriginalCronExpression.join(' ').replaceAll('?', '*'); //Adjust format for day of month/week syntax
}

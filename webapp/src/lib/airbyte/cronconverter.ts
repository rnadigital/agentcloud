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

export function convertUnitToCron(timeUnit: string) {
	switch (timeUnit) {
		case 'minute':
			return '0 * * ? * *'; // At second :00 of every minute
		case 'hour':
			return '0 0 * ? * *'; // At second :00 of minute :00 of every hour
		case 'day':
			return '0 0 0 * * ?'; // At 00:00:00am every day
		case 'week':
			return '0 0 0 ? * MON'; // At 00:00:00am, on every Monday, every month
		case 'month':
			return '0 0 0 1 * ?'; // Every month on the 1st, at 00:00:00am
		case 'year':
			return '0 0 0 1 JAN ? *'; // At 00:00:00am, on the 1st day, in January
		default:
			throw new Error('Invalid time unit');
	}
}

export default function convertCronToQuartz(cronExpression: string): string {
	const parts: string[] = cronExpression.trim().split(/\s+/);

	if (parts.length !== 5) {
		throw new Error('Invalid cron expression. Expected 5 parts.');
	}

	const [minutes, hours, dayOfMonth, month, dayOfWeek] = parts;

	// Add seconds field at the beginning
	let quartzCron: string = `0 ${minutes} ${hours} ${dayOfMonth} ${month} ${dayOfWeek}`;

	// Adjust day fields if both are specified
	if (dayOfMonth !== '*' && dayOfMonth !== '?' && dayOfWeek !== '*' && dayOfWeek !== '?') {
		quartzCron = `0 ${minutes} ${hours} ? ${month} ${dayOfWeek}`;
	}

	return quartzCron;
}

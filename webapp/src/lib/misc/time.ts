'use strict';

const YEAR = 31536000000,
	MONTH = 2629800000,
	WEEK = 604800000,
	DAY = 86400000,
	HOUR = 3600000,
	MINUTE = 60000,
	SECOND = 1000;

export function relativeString(now, relativeTo) {
	let difference = now.getTime() - relativeTo.getTime();
	let amount = 0;
	let unit = '';
	let isFuture = false;
	if (difference < 0) {
		difference = Math.abs(difference);
		isFuture = true;
	}
	if (difference < MINUTE) {
		return 'Just now';
	} else if (difference < MINUTE * 59.5) {
		amount = Math.round(difference / MINUTE);
		unit = 'minute';
	} else if (difference < HOUR * 23.5) {
		amount = Math.round(difference / HOUR);
		unit = 'hour';
	} else if (difference < DAY * 6.5) {
		amount = Math.round(difference / DAY);
		unit = 'day';
	} else if (difference < WEEK * 3.5) {
		amount = Math.round(difference / WEEK);
		unit = 'week';
	} else if (difference < MONTH * 11.5) {
		amount = Math.round(difference / MONTH);
		unit = 'month';
	} else {
		amount = Math.round(difference / YEAR);
		unit = 'year';
	}
	return `${amount} ${unit}${amount > 1 ? 's' : ''} ${isFuture ? 'from now' : 'ago'}`;
}

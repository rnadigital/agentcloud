'use strict';

// Courtesy of https://gitgud.io/fatchan/jschan/-/blob/master/lib/converter/formatsize.js

const sizes: string[] = ['B', 'KB', 'MB', 'GB', 'TB'];
const k: number = 1024;

export default function formatSize(bytes: number): string {
	if (bytes === 0) {
		return '0B';
	}
	const i: number = Math.min(sizes.length - 1, Math.floor(Math.log(bytes) / Math.log(k)));
	return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))}${sizes[i]}`;
}

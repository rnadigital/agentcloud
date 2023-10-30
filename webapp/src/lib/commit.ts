'use strict';

import { execSync } from 'child_process';

export function getShortCommitHash() {
	/*  "but my bootcamp said you cant use synchronous methods!!"
		https://i.kym-cdn.com/photos/images/original/001/937/655/73c.jpg */
	return execSync('git rev-parse --short HEAD').toString().trim();
}

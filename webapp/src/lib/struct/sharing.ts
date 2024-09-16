'use strict';

import { Binary } from 'mongodb';

export enum SharingMode {
	TEAM = 'team',
	PUBLIC = 'public',
	PRIVATE = 'owner',
	WHITELIST = 'whitelist'
}

/* Note: While the permissions object is intended to hold permissions presence
 * in the permissions object as a key implies view/read access for now until we
 * implement checks and update middleware chains for more complex permissions.
 * Keys are intended to be user, team, or org IDs with a mapping to permissions.
 */
export type SharingConfig = {
	permissions: Record<string, Binary> | {}; //Note: string keys, not ObjectId
	mode: SharingMode;
};

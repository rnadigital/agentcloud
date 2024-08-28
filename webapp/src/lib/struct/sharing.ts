'use strict';

import { Binary } from 'mongodb';

export enum SharingMode {
	RESTRICTED = 'restricted',
	TEAM = 'team',
	PUBLIC = 'public'
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

/**
 * @openapi
 *  components:
 *   schemas:
 *    SharingMode:
 *     type: string
 *     description: Enum representing the different sharing modes.
 *     enum:
 *      - restricted
 *      - team
 *      - public
 *
 *    SharingConfig:
 *     type: object
 *     description: While the permissions object is intended to hold permissions presence in the permissions object as a key implies view/read access for now until we implement checks and update middleware chains for more complex permissions. Keys are intended to be user, team, or org IDs with a mapping to permissions.
 *     required:
 *      - permissions
 *      - mode
 *     properties:
 *      permissions:
 *       description: Permissions mapping where keys are user, team, or org IDs and values are permissions. Presence implies view/read access.
 *       type: object
 *       additionalProperties:
 *        type: string
 *      mode:
 *       description: The mode of sharing.
 *       $ref: '#/components/schemas/SharingMode'
 */

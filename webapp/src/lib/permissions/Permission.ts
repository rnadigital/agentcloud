import BigBitfield from 'big-bitfield';
import { ORG_BITS, TEAM_BITS } from 'permissions/bits';
import Metadata from 'permissions/metadata';
import Permissions from 'permissions/permissions';

export default class Permission extends BigBitfield {
	declare base64?: string;
	declare array?: Uint8Array;
	public get?(bit: Permissions | string | number): boolean;
	public set?(bit: Permissions | string | number, value: boolean);
	public setAll?(bits);

	constructor(data: string | number | number[] = Math.max(...Object.values(Permissions))) {
		super(data);
	}

	// List of permission bits
	static allPermissions = Object.values(Permissions).filter(v => typeof v === 'number');

	// Convert to a map of bit to metadata and state, for use in frontend
	toJSON() {
		return Object.entries(Metadata).reduce((acc, entry) => {
			acc[entry[0]] = {
				state: this.get(entry[0]),
				...entry[1]
			};
			return acc;
		}, {});
	}

	handleBody(body, editorPermission, handlingBits) {
		//TODO: make sure handlingBits passed to this is secure, its important to security
		for (let bit of handlingBits) {
			// If perm has no "parent" bit, or current user has the parent permission, set each bit based on the form input
			const allowedParent =
				Metadata[bit].parent == null || editorPermission.get(Metadata[bit].parent);
			if (allowedParent && !Metadata[bit].blocked) {
				this.set(parseInt(bit), body[`permission_bit_${bit}`] != null);
			}
		}
	}

	//TODO: move the data for these inheritances to the metadata structure, make the logic here dynamic
	applyInheritance() {
		if (this.get(Permissions.ROOT)) {
			this.setAll(Permission.allPermissions);
			return;
		}
		if (this.get(Permissions.ORG_OWNER)) {
			this.setAll(ORG_BITS);
			this.set(Permissions.TEAM_OWNER, true); // Naturally, org owner has all team owner perms too
		}
		if (this.get(Permissions.TEAM_OWNER) || this.get(Permissions.TEAM_ADMIN)) {
			this.setAll(TEAM_BITS);
		}
	}
}

import BigBitfield from 'big-bitfield';
import { ORG_BITS, TEAM_BITS } from 'permissions/bits';
import Metadata from 'permissions/metadata';
import Permissions from 'permissions/permissions';

export default class Permission extends BigBitfield {
	declare base64?: string;
	declare array?: Uint8Array;

	constructor(data: string | number | number[] = Math.max(...Object.values(Permissions))) {
		super(data);
	}

	// List of permission bits
	static allPermissions = Object.values(Permissions).filter(v => typeof v === 'number');

	// Convert to a map of bit to metadata and state, for use in frontend
	toJSON() {
		return Object.entries(Metadata).reduce(
			(acc, entry) => {
				acc[entry[0]] = {
					state: super.get(entry[0]),
					...entry[1]
				};
				return acc;
			},
			{} as Record<string, any>
		);
	}

	handleBody(body: Record<string, any>, editorPermission: Permission, handlingBits: string[]) {
		//TODO: make sure handlingBits passed to this is secure, its important to security
		for (let bit of handlingBits) {
			// If perm has no "parent" bit, or current user has the parent permission, set each bit based on the form input
			const allowedParent =
				Metadata[bit].parent == null || editorPermission.get(Metadata[bit].parent);
			if (allowedParent && !Metadata[bit].blocked) {
				super.set(parseInt(bit), body[`permission_bit_${bit}`] != null);
			}
		}
	}

	//TODO: move the data for these inheritances to the metadata structure, make the logic here dynamic
	applyInheritance() {
		if (super.get(Permissions.ROOT)) {
			super.setAll(Permission.allPermissions);
			return;
		}
		if (super.get(Permissions.ORG_OWNER)) {
			super.setAll(ORG_BITS);
			super.set(Permissions.TEAM_OWNER, true); // Naturally, org owner has all team owner perms too
		}
		if (super.get(Permissions.TEAM_OWNER) || super.get(Permissions.TEAM_ADMIN)) {
			super.setAll(TEAM_BITS);
		}
	}

	get(bit: Permissions | string | number): boolean {
		return super.get(bit);
	}

	set(bit: Permissions | string | number, value: boolean): void {
		super.set(bit, value);
	}

	setAll(bits: number[]): void {
		super.setAll(bits);
	}
}

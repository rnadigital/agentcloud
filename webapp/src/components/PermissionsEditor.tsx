import Permission from '@permission';
import Metadata from 'permissions/metadata';
import Permissions from 'permissions/permissions'; // Adjust the import path as necessary
import React, { useState } from 'react';
import { useRouter } from 'next/router';

import { useAccountContext } from 'context/account';

// Helper function to check if a permission is allowed
const isPermissionAllowed = (currentPermission, permissionKey) => {
	const metadata = Metadata[permissionKey];
	if (!metadata || metadata?.blocked === true) { return false; }
	if (!metadata.parent) { return true; }
	// Check if the current permission includes the parent permission
	return currentPermission.get(metadata.parent);
};

function PermissionsEditor({ currentPermission, editingPermission }) {

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;

	// const [editingPermissionState, setEditingPermissionState] = useState(editingPermission);
	// const [_, reRender] = useState(Date.now());

	async function permissionsPost(e) {
		e.preventDefault();
		console.log(e, e.target.elements);
		const body = new FormData();
		body.set('resourceSlug', resourceSlug as string);
		body.set('_csrf', csrf as string);
		for (let elem of Array.from(e.target.elements).filter(z => z.name.startsWith('permission_bit'))) {
			if (elem.checked) {
				body.set(elem.name, 'true'); //Note: value doesn't matter. Any value = true
			}
		}
		console.log(body);
		// await API.editTeamMember(agentState._id, body, () => {
		// 	toast.success('Permissions Updated');
		// }, (res) => {
		// 	toast.error(res);
		// }, null);
	}

	return (
		<form onSubmit={permissionsPost}>
			{Object.entries(Metadata).map(([key, { title, label, desc }]) => {
				const isEnabled = isPermissionAllowed(currentPermission, key);
				return (
					<div key={`perm_${title}_${key}`}>
						<label>
							<input
								type='checkbox'
								name={`permission_bit_${key}`}
								value='true'
								defaultChecked={currentPermission.get(parseInt(key))}
								// To understand name property, see Permission#handleBody()
								// checked={editingPermission.get(parseInt(key))}
								// onChange={(e) => {
								// 	editingPermission.set(parseInt(key), e.target.checked);
								// 	reRender(Date.now());
								// }}
							/>
							{`${title}: ${desc}`}
						</label>
					</div>
				);
			})}
			<button type='submit' value='submit'>submit</button>
		</form>
	);
}

export default PermissionsEditor;

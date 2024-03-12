import Permission from '@permission';
import Metadata from 'permissions/metadata';
import Permissions from 'permissions/permissions'; // Adjust the import path as necessary
import React, { useState } from 'react';

// Helper function to check if a permission is allowed
const isPermissionAllowed = (currentPermission, permissionKey) => {
	const metadata = Metadata[permissionKey];
	if (!metadata) { return false; }

	// If no parent is defined, it's a root permission and thus allowed
	if (!metadata.parent) { return true; }

	// Check if the current permission includes the parent permission
	return currentPermission.get(metadata.parent);
};

const PermissionsEditor = ({ currentPermission, editingPermission }) => {
	const [editingPermissionState, setEditingPermissionState] = useState(editingPermission);
	console.log(editingPermission);
	return (
		<div>
			{Object.entries(Metadata).map(([key, { title, label, desc }]) => {
				const isEnabled = isPermissionAllowed(currentPermission, key);
				const isChecked = editingPermissionState.get(parseInt(key));
				return (
					<div key={key}>
						<label>
							<input
								type='checkbox'
								checked={isChecked}
								disabled={!isEnabled}
								onChange={(e) => {
									editingPermission.set(parseInt(key), e.target.checked);
									setEditingPermissionState(editingPermission);
								}}
							/>
							{`${title}: ${desc}`}
						</label>
					</div>
				);
			})}
		</div>
	);
};

export default PermissionsEditor;

import * as API from '@api';
import Permission from '@permission';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import Metadata from 'permissions/metadata';
import Permissions from 'permissions/permissions'; // Adjust the import path as necessary
import React, { useReducer,useState } from 'react';
import { toast } from 'react-toastify';

// Helper function to check if a permission is allowed
const isPermissionAllowed = (editingPermission, permissionKey) => {
	const metadata = Metadata[permissionKey];
	if (!metadata || metadata?.blocked === true) { return false; }
	if (!metadata.parent) { return true; }
	// Check if the current permission includes the parent permission
	return editingPermission.get(metadata.parent);
};

enum setAction {
	ADD = 'ADD',
	DELETE = 'DELETE',
};

// Reducer function to manage set operations
function setReducer(state, action) {
	switch (action.type) {
		case setAction.ADD:
			return new Set([...state, action.payload]);
		case setAction.DELETE:
			state.delete(action.payload);
			return new Set(state);
		default:
			throw new Error(`Unhandled action type: ${action.type}`);
	}
}

function PermissionsEditor({ currentPermission, editingPermission }) {

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug, memberId } = router.query;

	const [editingPermissionState, updatePermissionState] = useReducer(setReducer, editingPermission||[]);

	async function permissionsPost(e) {
		e.preventDefault();
		console.log(e, e.target.elements);
		const body = new FormData();
		body.set('resourceSlug', resourceSlug as string);
		body.set('memberId', memberId as string);
		body.set('_csrf', csrf as string);
		for (let elem of Array.from(e.target.elements).filter((z: any) => z.name.startsWith('permission_bit'))) {
			if (elem['checked']) {
				body.set(elem['name'], 'true'); //Note: value doesn't matter. Any value = true
			}
		}
		console.log(body);
		await API.editTeamMember(body, () => {
			toast.success('Permissions Updated');
		}, (res) => {
			toast.error(res);
		}, null);
	}

// Wrap your form content in a div using grid classes to create a 3-column layout
	return (
		<form onSubmit={permissionsPost} className='max-w-full'>
			<div className='grid gap-4 grid-cols-3'>
				{Object.entries(Metadata).map(([key, { title, label, desc, heading }], index) => {
					const isEnabled = isPermissionAllowed(currentPermission, key);
					return (<>
						{heading && <h2 className='font-semibold mt-4 col-span-3'>{heading}</h2>}
						<div key={`perm_${title}_${key}`} className={`${heading && index % 3 === 0 ? 'col-span-3' : ''}`}>
							<div className='flex'>
								<label>
									<input
										className='mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500'
										type='checkbox'
										name={`permission_bit_${key}`}
										value='true'
										checked={editingPermission.get(parseInt(key))}
										onChange={(e) => {
											updatePermissionState({
												type: e.target.checked ? 'ADD' : 'DELETE',
												payload: parseInt(key)
											});
										}}
									/>
									<strong>{title}</strong>: {desc}
								</label>
							</div>
						</div>
					</>);
				})}
			</div>
			<button type='submit' value='submit'
				className='mt-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'

			>Submit</button>
		</form>
	);

}

export default PermissionsEditor;

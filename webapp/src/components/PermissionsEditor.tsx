import * as API from '@api';
import Permission from '@permission';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import Metadata from 'permissions/metadata';
import Permissions from 'permissions/permissions'; // Adjust the import path as necessary
import { OrgRoleOptions, OrgRoles, TeamRoleOptions, TeamRoles } from 'permissions/roles';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';

import { SubscriptionPlan } from '../lib/struct/billing';
import classNames from './ClassNames';
import SubscriptionModal from './SubscriptionModal';

// Helper function to check if a permission is allowed
const isPermissionAllowed = (currentPermission, permissionKey) => {
	const metadata = Metadata[permissionKey];
	if (!metadata || metadata?.blocked === true) {
		return false;
	}
	if (!metadata.parent) {
		return true;
	}
	// Check if the current permission includes the parent permission
	return currentPermission && currentPermission.get(metadata.parent);
};

function PermissionsEditor({ editingPermission, filterBits }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, permissions: currentPermission } = accountContext as any;
	const router = useRouter();
	//Lol
	const isOrg = router.asPath.includes('/org');
	const Roles = isOrg ? OrgRoles : TeamRoles;
	const RoleOptions = isOrg ? OrgRoleOptions : TeamRoleOptions;
	const { stripePlan } = account?.stripe || {};
	const isEnterprise = stripePlan === SubscriptionPlan.ENTERPRISE;
	const EditMemberFunction = isOrg ? API.editOrgMember : API.editTeamMember;
	const { resourceSlug, memberId } = router.query;
	const [_state, _updateState] = useState(Date.now());
	const [selectedRole, setSelectedRole] = useState('');
	const [editingPermissionState, setEditingPermission] = useState(editingPermission);
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		if (selectedRole) {
			setEditingPermission(Roles[selectedRole]);
		} else {
			setEditingPermission(editingPermission);
		}
	}, [selectedRole]);

	async function permissionsPost(e) {
		e.preventDefault();
		const body = new FormData();
		body.set('resourceSlug', resourceSlug as string);
		body.set('memberId', memberId as string);
		body.set('template', selectedRole as string);
		body.set('_csrf', csrf as string);
		for (let elem of Array.from(e.target.elements).filter((z: any) =>
			z.name.startsWith('permission_bit')
		)) {
			isOrg;
			if (elem['checked']) {
				body.set(elem['name'], 'true'); // Note: value doesn't matter. Any value = true
			}
		}
		await EditMemberFunction(
			body,
			() => {
				toast.success('Permissions Updated');
			},
			res => {
				toast.error(res);
			},
			null
		);
	}

	async function updateRole(e) {
		e.preventDefault();
		const rolePermissions = Roles[selectedRole];
		console.log(rolePermissions, selectedRole);
		if (rolePermissions) {
			const body = new FormData();
			body.set('resourceSlug', resourceSlug as string);
			body.set('memberId', memberId as string);
			body.set('_csrf', csrf as string);
			body.set('template', selectedRole as string);
			await EditMemberFunction(
				body,
				() => {
					toast.success('Role Updated');
				},
				res => {
					toast.error(res);
				},
				null
			);
		}
	}

	return (
		<>
			<SubscriptionModal
				open={modalOpen}
				setOpen={setModalOpen}
				title='Upgrade Required'
				text='Custom permissions are only availalbe on the Enterprise plan'
				enterprise={true}
			/>
			<form onSubmit={permissionsPost} className='max-w-full'>
				<div className='mt-4'>
					<label
						htmlFor='role-select'
						className='block text-sm font-medium text-gray-700 dark:text-white'
					>
						Apply a Role
					</label>
					<select
						id='role-select'
						className='mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
						value={selectedRole}
						onChange={e => setSelectedRole(e.target.value)}
					>
						<option value='' disabled>
							Select Role
						</option>
						{RoleOptions.map(role => (
							<option key={role.value} value={role.value}>
								{role.label}
							</option>
						))}
					</select>
					<button
						onClick={updateRole}
						className='mt-2 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Save
					</button>
				</div>

				<hr className='my-4 dark:border-slate-700' />

				<div className='md:grid md:grid-cols-3 dark:text-white'>
					{Object.entries(Metadata)
						.filter(e => !filterBits || filterBits.includes(parseInt(e[0])))
						.map(([key, { title, label, desc, heading }], index) => {
							const isEnabled = isPermissionAllowed(currentPermission, key);
							return (
								<>
									{heading && <h2 className='font-semibold mt-4 col-span-3'>{heading}</h2>}
									<div
										key={`perm_${title}_${key}`}
										className={classNames(
											heading && index % 3 === 0 && 'col-span-3',
											'py-4 border-b px-2 flex'
										)}
									>
										<div className='flex'>
											<label>
												<input
													className={`mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${!isEnabled ? 'cursor-not-allowed' : ''}`}
													type='checkbox'
													disabled={!isEnabled}
													name={`permission_bit_${key}`}
													value='true'
													checked={editingPermissionState.get(parseInt(key))}
													onChange={e => {
														if (!isEnterprise) {
															return setModalOpen(true);
														}
														editingPermissionState.set(
															parseInt(key),
															e.target.checked ? true : false
														);
														_updateState(Date.now());
													}}
												/>
												<strong>{title}</strong>: {desc}
											</label>
										</div>
									</div>
								</>
							);
						})}
				</div>
				{isEnterprise && (
					<button
						type='submit'
						value='submit'
						className='mt-4 rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Submit
					</button>
				)}
			</form>
		</>
	);
}

export default PermissionsEditor;

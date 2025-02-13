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

function PermissionsEditor({
	editingPermission,
	filterBits,
	memberName,
	memberEmail,
	initialRole
}) {
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
	const [selectedRole, setSelectedRole] = useState(initialRole || '');
	const [editingPermissionState, setEditingPermission] = useState(editingPermission);
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		if (selectedRole) {
			setEditingPermission(Roles[selectedRole]);
		} else {
			setEditingPermission(editingPermission);
		}
	}, [selectedRole]);

	useEffect(() => {
		if (initialRole) {
			setSelectedRole(initialRole);
		}
	}, [initialRole]);

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

	async function handleRoleChange(e) {
		const newRole = e.target.value;
		setSelectedRole(newRole);

		const rolePermissions = Roles[newRole];
		if (rolePermissions) {
			const body = new FormData();
			body.set('resourceSlug', resourceSlug as string);
			body.set('memberId', memberId as string);
			body.set('_csrf', csrf as string);
			body.set('template', newRole as string);
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
			<div className='flex items-center space-x-6 h-20'>
				<div className='flex flex-col justify-center h-full'>
					<span className='text-2xl font-medium text-gray-800 dark:text-white'>{memberName}</span>
					<span className='text-sm font-medium text-gray-600 dark:text-white'>{memberEmail}</span>
				</div>
				<form onSubmit={permissionsPost} className='flex items-center h-full'>
					<select
						id='role-select'
						className='block w-48 pl-3 pr-10 py-2 text-base text-gray-400 font-medium border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md'
						value={selectedRole}
						onChange={handleRoleChange}
					>
						{RoleOptions.map(role => (
							<option key={role.value} value={role.value}>
								{role.label}
							</option>
						))}
					</select>
				</form>
			</div>
			<div className='md:grid md:grid-cols-3 gap-4 dark:text-white'>
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
										'py-4 border-b px-2'
									)}
								>
									<label className='flex items-start space-x-2'>
										<input
											className={`mt-1 mr-2 h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500 ${!isEnabled ? 'cursor-not-allowed' : ''}`}
											type='checkbox'
											disabled={!isEnabled}
											name={`permission_bit_${key}`}
											value='true'
											checked={editingPermissionState.get(parseInt(key))}
											onChange={e => {
												if (!isEnterprise) {
													return setModalOpen(true);
												}
												editingPermissionState.set(parseInt(key), e.target.checked ? true : false);
												_updateState(Date.now());
											}}
										/>
										<div className='flex-1'>
											<strong>{title}</strong>
											<span className='block text-sm text-gray-600 dark:text-gray-300'>{desc}</span>
										</div>
									</label>
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
		</>
	);
}

export default PermissionsEditor;

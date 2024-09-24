import * as API from '@api';
import { PencilIcon, StarIcon, TrashIcon, UserIcon } from '@heroicons/react/20/solid';
import ConfirmModal from 'components/ConfirmModal';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Permissions from 'permissions/permissions';
import { usePostHog } from 'posthog-js/react';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function TeamMemberCard({ team, member, callback }) {
	const [accountContext]: any = useAccountContext();
	const { csrf, permissions, account } = accountContext as any;
	const { stripePlan } = account || {};
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [confirmOpen, setConfirmOpen] = useState(false);
	const [selectedMember, setSelectedMember] = useState(null);
	const posthog = usePostHog();

	async function deleteMember(e) {
		e.preventDefault();
		posthog.capture('deleteUser', {
			name: member.name,
			email: member.email,
			stripePlan
		});
		await API.deleteFromTeam(
			{ resourceSlug, _csrf: csrf, memberId: member._id },
			() => {
				toast.success(`Team member ${member.name} removed`);
				callback && callback();
			},
			res => {
				toast.error(res);
			},
			null
		);
	}

	const isOwner = member?._id?.toString() === (team && team[0].ownerId?.toString());
	const me = account?._id && member?._id?.toString() === account?._id?.toString();

	const openConfirmModal = member => {
		setSelectedMember(member);
		setConfirmOpen(true);
	};

	const transferOwnership = async () => {
		if (!selectedMember) {
			return;
		}
		try {
			await API.transferTeamOwnership(
				{
					resourceSlug,
					newOwnerId: selectedMember._id,
					_csrf: csrf
				},
				() => {
					toast.success(`Team ownership transferred to ${selectedMember.name}`);
					callback && callback();
				},
				res => {
					toast.error(res);
				},
				null
			);
		} catch (error) {
			toast.error('Failed to transfer ownership');
		} finally {
			setConfirmOpen(false);
		}
	};

	return (
		<div className='p-4 max-w-sm bg-white rounded-lg border border-gray-200 shadow-md min-w-[200px] dark:bg-slate-800 dark:border-slate-700'>
			<p className='mb-2 font-bold tracking-tight text-gray-900 flex space-x-4 dark:text-gray-50'>
				<span>{member.name}</span>
				{!me && permissions.get(Permissions.EDIT_TEAM_MEMBER) && (
					<Link href={`/${resourceSlug}/team/${member._id}/edit`}>
						<PencilIcon className='h-5 w-5 text-gray-400 dark:text-white' aria-hidden='true' />
					</Link>
				)}
			</p>
			<p className='mb-3 font-normal text-sm text-gray-700 dark:text-gray-50'>{member.email}</p>
			<div className='flex space-x-4 space-between w-full relative'>
				<span
					className={`px-3 py-1 text-sm font-semibold text-white rounded-full ${isOwner || member.emailVerified ? 'bg-green-500' : 'bg-yellow-500'}`}
				>
					{isOwner || member.emailVerified ? 'Active' : 'Pending'}
				</span>
				{isOwner && (
					<span className='px-3 py-1 text-sm font-semibold text-white rounded-full bg-orange-500 flex'>
						<StarIcon className='w-5 h-5 me-1' /> Team Owner
					</span>
				)}
				{team && !me && permissions.get(Permissions.REMOVE_TEAM_MEMBER) && !isOwner && (
					<button
						type='button'
						onClick={deleteMember}
						className='rounded-full bg-indigo-600 p-1 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 absolute right-8 h-full'
					>
						<TrashIcon className='h-5 w-5' aria-hidden='true' />
						<span className='tooltip z-100'>
							<span className='tooltiptext capitalize !w-[120px] !-ml-[60px]'>
								Edit permissions
							</span>
						</span>
					</button>
				)}
				{/*team &&
					!isOwner && //dont show for team owner
					(!me || permissions.get(Permissions.ORG_OWNER)) && //dont show for own account if we aren't org owner
					(account._id.toString() === team[0].ownerId.toString() ||
						permissions.get(Permissions.ORG_OWNER)) && ( //show if team owner or org owner
						<button
							type='button'
							onClick={() => openConfirmModal(member)}
							className='rounded-full bg-blue-600 p-1 text-white shadow-sm hover:bg-blue-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600 absolute right-0 h-full'
						>
							<StarIcon className='h-5 w-5' aria-hidden='true' />
							<span className='tooltip z-100'>
								<span className='tooltiptext capitalize !w-[120px] !-ml-[60px]'>
									Transfer ownership
								</span>
							</span>
						</button>
					)*/}
			</div>
			{/* <ConfirmModal
				open={confirmOpen}
				setOpen={setConfirmOpen}
				confirmFunction={transferOwnership}
				cancelFunction={() => setConfirmOpen(false)}
				title='Confirm Ownership Transfer'
				message={`Are you sure you want to transfer ownership to ${selectedMember?.name}? This action cannot be undone.`}
			/> */}
		</div>
	);
}

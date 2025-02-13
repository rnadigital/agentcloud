import { CheckIcon, MinusIcon, PencilIcon, TrashIcon } from '@heroicons/react/20/solid';
import ButtonSpinner from 'components/ButtonSpinner';
import classNames from 'components/ClassNames';
import DevBadge from 'components/DevBadge';
import { useAccountContext } from 'context/account';
import Permissions from 'lib/permissions/permissions';
import { roleNameMap } from 'lib/permissions/roles';
import { useRouter } from 'next/router';
import { useReducer } from 'react';
import submittingReducer from 'utils/submittingreducer';

export default function MemberList({
	members,
	permissions,
	fetchTeam,
	deleteCallback
}: {
	members: any[];
	permissions?: any;
	fetchTeam?: any;
	deleteCallback?: Function;
}) {
	const [accountContext]: any = useAccountContext();
	const { account, permissions: userPermissions } = accountContext as any;
	const router = useRouter();
	const isOrg = router.asPath.includes('/org');
	const { resourceSlug } = router.query;
	const [deleting, setDeleting] = useReducer(submittingReducer, {});

	async function deleteMember(memberId) {
		setDeleting({ [memberId]: true });
		try {
			await deleteCallback(memberId);
		} finally {
			setDeleting({ [memberId]: false });
		}
	}

	return (
		<table className='min-w-full divide-y divide-gray-200 dark:divide-slate-700'>
			<thead className='bg-gray-100 rounded-md dark:bg-slate-800'>
				<tr>
					<th
						scope='col'
						className='px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300'
					>
						Name
					</th>
					<th
						scope='col'
						className='px-6 pl-0 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300'
					>
						Status
					</th>
					<th
						scope='col'
						className='px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300'
					>
						Role
					</th>
					<th></th>
					<th
						scope='col'
						className='px-4 py-3 w-20 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider dark:text-gray-300'
					>
						Action
					</th>
				</tr>
			</thead>
			<tbody className='divide-y divide-gray-200 dark:bg-slate-800 dark:divide-slate-700'>
				{members &&
					members.map(member => {
						const isMe = member?._id?.toString() === account?._id?.toString();
						return (
							<tr
								key={member._id}
								className={classNames(
									'hover:bg-gray-50 dark:hover:bg-slate-700',
									isMe && 'font-semibold'
								)}
							>
								<td className='px-4 py-3 whitespace-nowrap'>
									<div className='text-md text-gray-900 dark:text-gray-300'>{member.name}</div>
									<DevBadge label='ID' value={member?._id} />
									<div className='text-sm text-gray-500 dark:text-gray-300'>{member.email}</div>
								</td>
								<td className='px-6 pl-0 py-3 whitespace-nowrap'>
									{member.emailVerified ? (
										<div className='flex items-center space-x-1'>
											<div className='p2 border border-green-500 rounded-full'>
												<CheckIcon className='h-3 w-3 text-green-500' aria-hidden='true' />
											</div>
											<span className='inline-block text-md'>Verified</span>
										</div>
									) : (
										<MinusIcon className='h-5 w-5 text-yellow-500' aria-hidden='true' />
									)}
								</td>
								<td className='px-6 py-3 whitespace-nowrap'>
									{permissions && permissions[member._id.toString()] ? (
										roleNameMap[permissions[member._id.toString()]]
									) : isOrg ? (
										'Org Member'
									) : (
										<MinusIcon className='h-5 w-5 text-gray-500' aria-hidden='true' />
									)}
								</td>
								<td className='px-20 py-3'></td>
								<td className='px-6 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-1 items-center'>
									{userPermissions.get(
										Permissions[isOrg ? 'EDIT_ORG_MEMBER' : 'EDIT_TEAM_MEMBER']
									) &&
										!isMe && (
											<a
												href={`/${resourceSlug}/${isOrg ? 'org' : 'team'}/${member._id}/edit`}
												className='p-1 border rounded-md border-gray-300 group'
											>
												<PencilIcon
													className='h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 transition-all duration-100 ease'
													aria-hidden='true'
												/>
											</a>
										)}
									{userPermissions.get(
										Permissions[isOrg ? 'REMOVE_ORG_MEMBER' : 'REMOVE_TEAM_MEMBER']
									) &&
										!isMe && (
											<button
												onClick={() => deleteMember(member._id)}
												className='p-1 border rounded-md border-gray-300 group'
												disabled={deleting[member._id]}
											>
												{deleting[member._id] ? (
													<ButtonSpinner size={14} />
												) : (
													<TrashIcon
														className='h-4 w-4 text-gray-400 group-hover:text-gray-600 dark:text-gray-300 transition-all duration-100 ease'
														aria-hidden='true'
													/>
												)}
											</button>
										)}
								</td>
							</tr>
						);
					})}
			</tbody>
		</table>
	);
}

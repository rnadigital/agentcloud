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
		<div className='rounded-lg overflow-hidden shadow overflow-x-auto'>
			<table className='min-w-full divide-y divide-gray-200'>
				<thead className='bg-white dark:bg-slate-800 dark:!border-slate-700'>
					<tr>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'
						>
							Name
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'
						>
							Email
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'
						>
							Role
						</th>
						<th
							scope='col'
							className='px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase dark:text-white'
						>
							Email Verified
						</th>
						<th
							scope='col'
							className='px-6 py-3 w-20 text-right text-xs font-medium text-gray-500 uppercase dark:text-white'
						>
							Actions
						</th>
					</tr>
				</thead>
				<tbody className='bg-white divide-y divide-gray-200 dark:bg-slate-800'>
					{members &&
						members.map(member => {
							const isMe = member?._id?.toString() === account?._id?.toString();
							return (
								<tr
									key={member._id}
									className={classNames(
										'hover:bg-gray-50 dark:hover:bg-slate-700 dark:!border-slate-700 dark:text-white',
										isMe && 'font-bold'
									)}
								>
									<td className='px-6 py-3 whitespace-nowrap'>
										<div className='text-sm text-gray-900 dark:text-white'>{member.name}</div>
										<DevBadge label='ID' value={member?._id} />
									</td>
									<td className='px-6 py-3 whitespace-nowrap'>
										<div className='text-sm text-gray-900 dark:text-white'>{member.email}</div>
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
									<td className='px-6 py-3 whitespace-nowrap'>
										{member.emailVerified ? (
											<CheckIcon className='h-5 w-5 text-green-500' aria-hidden='true' />
										) : (
											<MinusIcon className='h-5 w-5 text-yellow-500' aria-hidden='true' />
										)}
									</td>

									<td className='px-6 py-5 whitespace-nowrap text-right text-sm font-medium flex justify-end space-x-5 items-center'>
										{userPermissions.get(
											Permissions[isOrg ? 'EDIT_ORG_MEMBER' : 'EDIT_TEAM_MEMBER']
										) &&
											!isMe && (
												<a
													href={`/${resourceSlug}/${isOrg ? 'org' : 'team'}/${member._id}/edit`}
													className='text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-white'
												>
													<PencilIcon className='h-5 w-5' aria-hidden='true' />
												</a>
											)}
										{userPermissions.get(
											Permissions[isOrg ? 'REMOVE_ORG_MEMBER' : 'REMOVE_TEAM_MEMBER']
										) &&
											!isMe && (
												<button
													onClick={() => deleteMember(member._id)}
													className='text-red-500 hover:text-red-700'
													disabled={deleting[member._id]}
												>
													{deleting[member._id] ? (
														<ButtonSpinner size={14} />
													) : (
														<TrashIcon className='h-5' aria-hidden='true' />
													)}
												</button>
											)}
									</td>
								</tr>
							);
						})}
				</tbody>
			</table>
		</div>
	);
}

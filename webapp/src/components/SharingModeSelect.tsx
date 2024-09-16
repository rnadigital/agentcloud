import * as API from '@api';
import SharingModeInfoAlert from 'components/SharingModeInfoAlert';
import WhiteListSharing from 'components/sharingmodes/WhiteListSharing';
import SubscriptionModal from 'components/SubscriptionModal';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Select from 'react-tailwindcss-select';
import { toast } from 'react-toastify';
import { pricingMatrix } from 'struct/billing';
import { ShareLinkTypes } from 'struct/sharelink';
import { SharingMode } from 'struct/sharing';
import SelectClassNames from 'styles/SelectClassNames';

const sharingModeOptions = [
	{
		label: 'Public',
		value: SharingMode.PUBLIC
	},
	{
		label: 'My Team (Default)',
		value: SharingMode.TEAM
	},
	{
		label: 'Whitelist',
		value: SharingMode.WHITELIST
	},
	{
		label: 'Private',
		value: SharingMode.PRIVATE
	}
];

const SharingModeSelect = ({
	title = 'Sharing Mode',
	sharingMode,
	setSharingMode,
	shareLinkShareId,
	setShareLinkShareId,
	showInfoAlert = false,
	emailOptions,
	emailState,
	shareEmail,
	setShareEmail,
	onChange = undefined,
	setModalOpen = undefined
}) => {
	const [loading, setLoading] = useState(false);
	const [accountContext]: any = useAccountContext();
	const [subscriptionModalOpen, setSubscriptionModalOpen] = useState(false);
	const { csrf, account } = accountContext as any;
	const { stripePlan } = account?.stripe || {};
	const router = useRouter();
	const { resourceSlug } = router.query;
	async function createShareLink() {
		setLoading(true);
		try {
			await API.createShareLink(
				{
					_csrf: csrf,
					resourceSlug,
					type: ShareLinkTypes.APP
				},
				res => {
					setShareLinkShareId(res?.shareLinkId || null);
				},
				err => {
					toast.error(err);
				},
				router
			);
		} finally {
			setLoading(false);
		}
	}

	useEffect(() => {
		if (shareLinkShareId === null && sharingMode !== SharingMode.TEAM) {
			//for cloning, sharingMode may not be team but the ID will be null in initial state, recreate the share link
			createShareLink();
		}
	}, []);
	return (
		<>
			<SubscriptionModal
				open={subscriptionModalOpen !== false}
				setOpen={setSubscriptionModalOpen}
				title='Upgrade Required'
				text='Public app sharing is only available on the Teams plan or higher.'
				buttonText='Upgrade'
			/>
			<div className='sm:col-span-12'>
				<label
					htmlFor='sharingMode'
					className='block text-sm font-medium leading-6 text-gray-900 dark:text-slate-400'
				>
					{title}
				</label>
				<div className='mt-2'>
					<Select
						loading={loading === true}
						primaryColor={'indigo'}
						classNames={SelectClassNames}
						value={sharingModeOptions.find(o => o.value === sharingMode)}
						onChange={(v: any) => {
							if (v?.value !== SharingMode.TEAM) {
								if (!pricingMatrix[stripePlan]?.allowFunctionTools) {
									return setSubscriptionModalOpen(true);
								}
								createShareLink();
							} else {
								setShareLinkShareId(null);
							}
							setSharingMode(v ? v.value : null);
						}}
						options={sharingModeOptions}
						formatOptionLabel={option => {
							return (
								<li
									className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
										option.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
									}`}
								>
									{option.label}
								</li>
							);
						}}
					/>
				</div>
			</div>
			{showInfoAlert && sharingMode === SharingMode.PUBLIC && (
				<div className='col-span-12'>
					<SharingModeInfoAlert shareLinkShareId={shareLinkShareId} />
				</div>
			)}
			{sharingMode == SharingMode.WHITELIST && (
				<div className='col-span-12'>
					<WhiteListSharing
						shareLinkShareId={shareLinkShareId}
						setModalOpen={setModalOpen}
						emailState={emailState}
						emailOptions={emailOptions}
						onChange={onChange}
						shareEmail={shareEmail}
						setShareEmail={setShareEmail}
					/>
				</div>
			)}
			{sharingMode == SharingMode.PRIVATE && (
				<div className='col-span-12'>
					<SharingModeInfoAlert
						shareLinkShareId={shareLinkShareId}
						message='Accessible by the creator of the app and team/org owners only.'
						classNames='rounded bg-blue-200 p-4 -mt-3 sm:col-span-12'
					/>
				</div>
			)}
		</>
	);
};

export default SharingModeSelect;

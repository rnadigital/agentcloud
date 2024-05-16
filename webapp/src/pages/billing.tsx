import * as API from '@api';
import ErrorAlert from 'components/ErrorAlert';
import Spinner from 'components/Spinner';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { SubscriptionPlan, subscriptionPlans as plans } from 'struct/billing';

function SubscriptionCard({ title, link = null, plan = null, price = null, description = null, icon = null,
	isPopular = false, selectedPlan, setSelectedPlan, usersAddon, storageAddon }) {
	const router = useRouter();
	const [accountContext]: any = useAccountContext();
	const { csrf, account } = accountContext as any;
	const { stripeCustomerId, stripePlan, stripeEndsAt, stripeTrial, stripeAddons } = account?.stripe || {};
	const currentPlan = plan === stripePlan;
	const numberPrice = typeof price === 'number';
	const [editedAddons, setEditedAddons] = useState(false);

	const [addons, setAddons] = useState({
		users: stripeAddons?.users || 0,
		storage: stripeAddons?.storage || 0,
	});
	
	useEffect(() => {
		const edited = addons?.users != stripeAddons.users
			|| addons?.storage != stripeAddons.storage;
		setEditedAddons(edited);
	}, [addons?.users, addons?.storage]);

	const handleIncrement = (key) => {
		setAddons((prev) => ({
			...prev,
			[key]: prev[key] + 1,
		}));
	};

	const handleDecrement = (key) => {
		setAddons((prev) => ({
			...prev,
			[key]: prev[key] > 0 ? prev[key] - 1 : 0,
		}));
	};

	const renderAddons = (addons) => {
		return (
			<div className={`space-y-2 opacity-0 overflow-hidden transition-all ${selectedPlan === plan ? 'opacity-100' : 'opacity-0'}`}>
				{usersAddon === true && (
					<div className='flex flex-row justify-between w-full'>
						<button onClick={() => handleDecrement('users')} className='bg-gray-300 dark:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center'>-</button>
						<span>Extra Team Members: {addons.users || 0}</span>
						<button onClick={() => handleIncrement('users')} className='bg-gray-300 dark:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center'>+</button>
					</div>
				)}
				{storageAddon === true && (
					<div className='flex flex-row justify-between w-full'>
						<button onClick={() => handleDecrement('storage')} className='bg-gray-300 dark:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center'>-</button>
						<span>Extra GB Vector Storage: {addons.storage || 0}</span>
						<button onClick={() => handleIncrement('storage')} className='bg-gray-300 dark:bg-gray-800 rounded-full w-6 h-6 flex items-center justify-center'>+</button>
					</div>
				)}
			</div>
		);
	};

	return (
		<div
			className={`transition-all cursor-pointer w-max min-w-[300px] rounded-lg p-4 border ${selectedPlan === plan
				? 'shadow-lg bg-blue-100 border-blue-400 dark:bg-blue-900 border-1'
				: 'border hover:shadow-lg hover:border-gray-300 hover:bg-gray-100 dark:border-gray-800 dark:hover:border-gray-700 dark:hover:bg-gray-800'}`}
			onClick={() => setSelectedPlan(plan)}
		>
			{!currentPlan && isPopular && (
				<span className='px-2 py-[0.5px] bg-yellow-100 text-yellow-800 border border-yellow-300 text-sm rounded-lg'>
					Most popular
				</span>
			)}
			{currentPlan && (<>
				<div className='flex items-center'>
					<span className='px-2 py-[0.5px] me-2 bg-white text-blue-800 border border-blue-300 text-sm rounded-lg'>
						Current Plan
					</span>
				</div>
				{price > 0 && (
					<span suppressHydrationWarning className='text-sm px-2 py-[0.5px] me-2 bg-white text-green-800 border border-green-300 text-sm rounded-lg'>
						Renews {new Date(stripeEndsAt).toDateString()}
					</span>
				)}
			</>)}
			<div className='flex justify-center align-middle mt-4'>
				<img className='rounded-md w-24 h-24 lg:w-48 lg:h-48' src={`/images/agentcloud-mark-white-bg-black-${plan}.png`} />
			</div>
			<div className='flex items-center mt-4'>
				<h2 className='text-lg font-semibold'>{title}</h2>
			</div>
			<div className='mt-1 min-h-[80px]'>
				{description}
				{price > 0		//and not free plan
					&& plan !== SubscriptionPlan.ENTERPRISE //and not customisable on enterprise
					&& renderAddons(addons)}
			</div>
			<div className='mt-4 flex flex-row'>
				<span className='text-4xl font-bold'>{numberPrice && '$'}{price}</span>
				{numberPrice && (
					<span className='text-sm text-gray-500 flex flex-col ps-1'>
						<span>per</span>
						<span>month</span>
					</span>
				)}
			</div>
			{link ? (
				<Link
					className='block text-center w-full bg-indigo-600 text-white px-4 py-2 font-semibold rounded-md mt-2'
					href={link}
					rel='noopener noreferrer'
					target='_blank'
				>
					Contact us
				</Link>
			) : (
				<button
					onClick={() => {
						const payload = {
							_csrf: csrf,
							plan,
							...addons,
						};
						API.changePlan(payload, null, toast.error, router);
					}}
					disabled={selectedPlan !== plan}
					className={'mt-4 transition-colors flex w-full justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-600'}
				>
					{currentPlan ? (editedAddons ? 'Update Subscription' : 'Manage Subscription') : 'Change Plan'}
				</button>
			)}
		</div>
	);
}

export default function Billing(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const { stripeCustomerId, stripePlan } = account?.stripe || {};
	const [selectedPlan, setSelectedPlan] = useState(stripePlan);
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { resourceSlug } = router.query;

	// TODO: move this to a lib (IF its useful in other files)
	const stripeMethods = [API.getPortalLink];
	function createApiCallHandler(apiMethod) {
		return (e) => {
			e.preventDefault();
			apiMethod({
				_csrf: e.target._csrf.value,
			}, null, setError, router);
		};
	}
	const [getPaymentLink, getPortalLink] = stripeMethods.map(createApiCallHandler);

	function fetchAccount() {
		if (resourceSlug) {
			API.getAccount({ resourceSlug }, dispatch, setError, router);
		}
	}

	useEffect(() => {
		fetchAccount();
	}, [resourceSlug]);

	if (!account) {
		return <Spinner />;
	}

	return (
		<>
			<Head>
				<title>Billing</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='border-b dark:border-slate-400 pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Plan Selection</h3>
			</div>

			<div className='flex flex-row flex-wrap gap-4 py-4 items-center'>
				{plans.map((plan) => (
					<SubscriptionCard
						key={plan.plan}
						title={plan.title}
						price={plan.price}
						plan={plan.plan}
						isPopular={plan.isPopular}
						link={plan.link}
						storageAddon={plan.storageAddon}
						usersAddon={plan.usersAddon}
						selectedPlan={selectedPlan}
						setSelectedPlan={setSelectedPlan}
					/>
				))}
			</div>
			<div className='border-b dark:border-slate-400 mt-2'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Payment Methods & Invoice History</h3>
			</div>
			<div className='flex flex-row flex-wrap gap-4 mb-2 items-center'>
				<button
					onClick={() => {
						API.getPortalLink({
							_csrf: csrf,
						}, null, toast.error, router);
					}}
					disabled={!stripeCustomerId}
					className={'mt-4 transition-colors flex justify-center rounded-md bg-indigo-600 px-3 py-1.5 text-sm font-semibold leading-6 text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-600'}
				>
					Manage Subscription
				</button>
			</div>
		</>
	);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}

import * as API from '@api';
import ErrorAlert from 'components/ErrorAlert';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
// import StripePricingTable from 'components/StripePricingTable';
import { SubscriptionPlan } from 'struct/billing';

function SubscriptionCard({ title, link=null, plan=null, price=null, description=null, icon=null, isPopular=false }) {
	const router = useRouter();
	const [accountContext]: any = useAccountContext();
	const { csrf, account } = accountContext as any;
	const { stripeCustomerId, stripePlan } = account?.stripe || {};
	const currentPlan = plan === stripePlan;
	const numberPrice = typeof price === 'number';
	return <div className={` cursor-pointer w-max min-w-[300px] rounded-lg p-6 ${isPopular ? 'shadow-lg border border-gray-300' : ''} ${currentPlan ? 'shadow-lg bg-blue-100 border-blue-400 border-2' : ''}`} style={{ backgroundColor: isPopular ? '#f2f2f2' : '' }}>
		{!currentPlan && isPopular && <span className='px-2 py-[0.5px] bg-yellow-100 text-yellow-800 border border-yellow-300 text-sm rounded-lg'>
			{!currentPlan && isPopular && 'Most popular'}
		</span>}
		{currentPlan && <span className='px-2 py-[0.5px] bg-white text-blue-800 border border-blue-300 text-sm rounded-lg'>
			Current Plan
		</span>}
		<div className={`flex items-center mt-4 ${!currentPlan && !isPopular ? 'pt-6' : ''}`}>
			<img className='rounded-md' src='https://img.stripecdn.com/cdn-cgi/image/format=auto,height=120,dpr=1/https://d1wqzb5bdbcre6.cloudfront.net/36e781f597cce399b4abf2ed9a7b279b7519671c0568a2fea27bb19a684d00e1/68747470733a2f2f66696c65732e7374726970652e636f6d2f6c696e6b732f4d44423859574e6a64463878526d5671546d6445654645355231704c656e5a7666475a735833526c63335266636b74595157784459337042546e55305230355a53576c714f456c6b624531363030396876446d514330' />
		</div>
		<div className='flex items-center mt-4'>
			<h2 className='text-lg font-semibold'>{title}</h2>
		</div>
		<p className='mt-1 min-h-[60px]'>
			{description}
		</p>
		<div className='mt-4 flex flex-row'>
			<span className='text-4xl font-bold'>{numberPrice && '$'}{price}</span>
			{numberPrice && <span className='text-sm text-gray-500 flex flex-col ps-1'>
				<span>per</span>
				<span>month</span>
			</span>}
		</div>
		{link
			? <Link
				className='block text-center w-full mt-6 bg-indigo-600 text-white px-4 py-2 font-semibold rounded-md'
				href={link}
				rel='noopener noreferrer'
				target='_blank'
			>
				Contact us
			</Link>
			: <button onClick={() => {
				if (!stripeCustomerId) {
					API.getPaymentLink({
						_csrf: csrf,
						plan,
					}, null, toast.error, router);
				} else {
					API.getPortalLink({
						_csrf: csrf,
					}, null, toast.error, router);
				}
			}} className='w-full mt-6 bg-indigo-600 text-white px-4 py-2 font-semibold rounded-md'>
				{numberPrice ? (stripeCustomerId && currentPlan ? 'Manage Subscription' : 'Subscribe') : 'Contact us'}
			</button>}
	</div>;
}

export default function Billing(props) {

	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { resourceSlug } = router.query;

	// TODO: move this to a lib (IF its useful in other files)
	const stripeMethods = [API.getPaymentLink, API.getPortalLink, API.changePlan];
	function createApiCallHandler(apiMethod) {
		return (e) => {
			e.preventDefault();
			apiMethod({
				_csrf: e.target._csrf.value,
			}, null, setError, router);
		};
	}
	const [getPaymentLink, getPortalLink, changePlan, createPortalSession] = stripeMethods.map(createApiCallHandler);

	function fetchAccount() {
		API.getAccount({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchAccount();
	}, [resourceSlug]);
	
	if (!account) {
		return 'Loading...'; //TODO: loader
	}

	const { stripeCustomerId, stripePlan /*, stripeEndsAt, stripeCancelled*/ } = account?.stripe || {};

	return (
		<>

			<Head>
				<title>Billing</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='border-b dark:border-slate-400 pb-2 my-2'>
				<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>Manage Subscription</h3>
			</div>

			{/*<StripePricingTable />*/}

			<div className='flex flex-row gap-x-4 py-4'>
				<SubscriptionCard title='Agent Cloud Free' price={0} plan={SubscriptionPlan.FREE} />
				<SubscriptionCard title='Agent Cloud Pro' price={4} plan={SubscriptionPlan.PRO} />
				<SubscriptionCard title='Agent Cloud Teams' price={8} isPopular={true} plan={SubscriptionPlan.TEAMS} />
				<SubscriptionCard title='Agent Cloud Enterprise' price={'Custom'} link={'https://www.agentcloud.dev/contact'} />
			</div>
			
			{/*<form onSubmit={getPortalLink}>
				<input type='hidden' name='_csrf' value={csrf} />
				<div className='mb-2 flex items-center justify-start gap-x-6'>
					<button
						type='submit'
						className='inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
					>
						Manage subscription
					</button>
				</div>
			</form>*/}

			<pre>{JSON.stringify(account?.stripe, null, '\t')}</pre>

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}

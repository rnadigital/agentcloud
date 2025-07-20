import * as API from '@api';
import { loadStripe } from '@stripe/stripe-js';
import ConfirmModal from 'components/ConfirmModal';
import ErrorAlert from 'components/ErrorAlert';
import InfoAlert from 'components/InfoAlert';
import Invoice from 'components/Invoice';
import ProgressBar from 'components/ProgressBar';
import Spinner from 'components/Spinner';
import StripeCheckoutModal from 'components/StripeCheckoutModal';
import { useAccountContext } from 'context/account';
import { Button } from 'modules/components/ui/button';
import { Card, CardContent, CardHeader } from 'modules/components/ui/card';
import Head from 'next/head';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import React, { useEffect, useState } from 'react';
import { toast } from 'react-toastify';
import { pricingMatrix, SubscriptionPlan, subscriptionPlans as plans } from 'struct/billing';
import { type Tool, ToolType } from 'struct/tool';

//DEVNOTE: see "src/lib/vectorproxy/client.ts" and "getVectorStorageForTeam", create an API route for this to get the used vector storage for this team. Once that's been retrieved use the stripe object to get the total avaiable storage and calculate the percentage

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY);

const pricingPlans = [
	{
		name: 'Free',
		price: '$0',
		plan: SubscriptionPlan.FREE,
		usage: ['Single User', '1 org with 1 team', '25 app runs per month', '5MB maximum file upload'],
		features: [
			'Conversational Chat Apps',
			{ text: 'File Support', subtext: '(CSV, DOC, TXT, PDF)' },
			'100MB Vector Storage',
			'Bring Your Own LLM'
		]
	},
	{
		name: 'Pro',
		price: '$99',
		plan: SubscriptionPlan.PRO,
		usage: ['All Free Plan +', '1,000 app runs per month', '1GB Vector Storage'],
		features: [
			'Process Multi-Agent Apps',
			{
				text: 'Data Integration',
				subtext: '(One Drive, Google Drive, Postgres, HubSpot, Google BigQuery, Airtable, Notion)'
			},
			'Deep Data Sync for RAG',
			'10 Custom Code Tools'
		]
	},
	{
		name: 'Teams',
		price: '$199',
		plan: SubscriptionPlan.TEAMS,
		usage: ['All Plan Pro +', '10 Users', '10GB Vector Storage', 'Unlimited Sessions'],
		features: [
			{ text: 'Embeddable Chat Apps', subtext: '(via HTML iframe)' },
			'Role-Based Access Controls',
			'Pro+ Integrations: Sharepoint, Snowflake, Salesforce, Gong, Zendesk, Confluence, and more',
			'20 Custom Code Tools',
			'Support Ticketing'
		]
	},
	{
		name: 'Enterprise',
		price: '$Custom',
		plan: SubscriptionPlan.ENTERPRISE,
		usage: ['All Teams +', 'SSO', 'Data Sync in Minutes', 'Self-Host (On-Prem)'],
		features: ['Multiple Teams + RBAC', 'Custom Data Connectors', 'Dedicated Support with SLA']
	}
];

const CheckMarkIcon = () => (
	<div className='h-3 w-3 rounded-full bg-indigo-600 flex items-center justify-center'>
		<svg className='h-2.5 w-2.5 text-white' fill='none' stroke='currentColor' viewBox='0 0 24 24'>
			<path strokeLinecap='round' strokeLinejoin='round' strokeWidth='3' d='M5 13l4 4L19 7' />
		</svg>
	</div>
);

const ListItem = ({ text, subtext = null }) => (
	<li className='flex items-center gap-2'>
		<CheckMarkIcon />
		<div className=''>
			{text}{' '}
			<span className='innline-block'>
				{subtext && <span className='text-gray-500'>{subtext}</span>}
			</span>
		</div>
	</li>
);

export default function Billing(props) {
	const [accountContext, refreshAccountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const currentOrg = account?.orgs?.find(o => o.id === account?.currentOrg);
	const { stripeCustomerId, stripePlan, stripeAddons } = currentOrg?.stripe || {};
	const [selectedPlan, setSelectedPlan] = useState(stripePlan);
	const router = useRouter();
	const [_, dispatch] = useState(props);
	const [error, setError] = useState();
	const { resourceSlug } = router.query;
	const [stagedChange, setStagedChange] = useState(null);
	const [show, setShow] = useState(false);
	const [showPaymentModal, setShowPaymentModal] = useState(false);
	const [showConfirmModal, setShowConfirmModal] = useState(false);
	const [continued, setContinued] = useState(false);
	const [last4, setLast4] = useState(null);
	const [missingEnvs, setMissingEnvs] = useState(null);
	const posthog = usePostHog();

	function getPayload() {
		return {
			_csrf: csrf,
			plan: selectedPlan,
			...(stagedChange?.users ? { users: stagedChange.users } : {}),
			...(stagedChange?.storage ? { storage: stagedChange.storage } : {})
		};
	}

	const stripeMethods = [API.getPortalLink];
	function createApiCallHandler(apiMethod) {
		return async e => {
			e.preventDefault();
			const res = await apiMethod(
				{
					_csrf: getPayload()._csrf
				},
				null,
				toast.error,
				null
			);
			if (res?.url) {
				window.location.href = res.url;
			}
		};
	}
	const [getPortalLink] = stripeMethods.map(createApiCallHandler);

	useEffect(() => {
		API.checkStripeReady(
			x => {
				setMissingEnvs(x.missingEnvs);
				API.hasPaymentMethod(
					res => {
						if (res && res?.ok === true && res?.last4) {
							setLast4(res?.last4);
						}
					},
					toast.error,
					router
				);
			},
			toast.error,
			router
		);
	}, [resourceSlug]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			refreshAccountContext();
		}, 500);
		return () => {
			clearTimeout(timeout);
		};
	}, [showConfirmModal]);

	useEffect(() => {
		const timeout = setTimeout(() => {
			setShow(stagedChange != null);
		}, 500);
		return () => {
			clearTimeout(timeout);
		};
	}, [stagedChange?.id]);

	if (!account || missingEnvs == null) {
		return <Spinner />;
	}

	if (missingEnvs.length > 0) {
		return (
			<ErrorAlert
				error={`Stripe functionality is missing the following:
${missingEnvs.join('\n')}`}
			/>
		);
	}

	const payload = getPayload();

	const renderPlanCard = planData => (
		<Card className='rounded-none border-none shadow-none'>
			<CardContent className='p-6'>
				<div className='bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-600 -skew-x-6 w-fit px-4 py-0 rounded-sm mb-5'>
					<span className='-skew-x-7 inline-block text-white font-medium'>{planData.name}</span>
				</div>
				<div className='mb-4'>
					<span className='text-3xl font-bold'>{planData.price}</span>
					{planData.price !== '$Custom' && <span className='text-muted-foreground'>/month</span>}
				</div>
				<Button
					className='w-full bg-gradient-to-r from-indigo-600 via-indigo-600 to-purple-700 hover:bg-indigo-700 mb-6'
					onClick={() => {
						setSelectedPlan(planData.plan);
						setStagedChange({ plan: planData.plan });
						setShowConfirmModal(true);
					}}>
					{account?.stripe.stripePlan === planData.name
						? 'Update Subscription'
						: planData.name === 'Enterprise'
							? 'Contact Us'
							: 'Change Plan'}
				</Button>

				<div className='space-y-4'>
					<h3 className='font-medium'>Usage</h3>
					<ul className='space-y-2'>
						{planData.usage.map((item, index) => (
							<ListItem key={`usage-${index}`} text={item} />
						))}
					</ul>

					<h3 className='font-medium pt-2'>Features</h3>
					<ul className='space-y-2'>
						{planData.features.map((item, index) => (
							<ListItem
								key={`feature-${index}`}
								text={typeof item === 'string' ? item : item.text}
								subtext={typeof item === 'string' ? null : item.subtext}
							/>
						))}
					</ul>
				</div>
			</CardContent>
		</Card>
	);

	return (
		<div className='p-6'>
			<Head>
				<title>Billing</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div className='mb-8'>
				<h2 className='text-xl font-semibold mb-2'>Manage Your Billing & Subscriptions</h2>
				<p className='text-muted-foreground mb-4'>
					View your payment history, manage your subscriptions, or cancel your plan easily through
					our secure customer portal.
				</p>
				<Button
					variant='outline'
					className='w-fit text-black hover:bg-gray-100'
					// onClick={getPortalLink}
					onClick={() => {
						window.open('https://billing.stripe.com/p/login/dR6cNudR20gl9JSbII', '_blank');
					}}>
					Go to Customer Portal
				</Button>
			</div>

			<div className='mb-8'>
				<h2 className='text-xl font-semibold mb-6'>Plan Selection</h2>
				<div className='grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4'>
					{pricingPlans.map((plan, index) => renderPlanCard(plan))}
				</div>
			</div>

			{/* Modals */}
			<ConfirmModal
				open={showConfirmModal}
				setOpen={setShowConfirmModal}
				confirmFunction={async () => {
					const { plan, users, storage } = payload;
					const posthogBody = {
						email: account?.email,
						oldPlan: stripePlan,
						oldAddons: stripeAddons,
						newPlan: plan,
						newAddons: { users, storage }
					};
					if (stripePlan === SubscriptionPlan.FREE) {
						posthog.capture('subscribe', posthogBody);
					} else if (plan !== stripePlan) {
						posthog.capture('changePlan', posthogBody);
					}
					if (users !== stripeAddons.users || storage !== stripeAddons.storage) {
						posthog.capture('updateAddons', posthogBody);
					}

					await API.confirmChangePlan(
						payload,
						res => {
							setTimeout(() => {
								toast.success('Subscription updated successfully');
								setStagedChange(null);
								setShowConfirmModal(false);
								setShowPaymentModal(false);
								setShow(false);
							}, 500);
						},
						toast.error,
						router
					);
				}}
				cancelFunction={async () => {
					setShowConfirmModal(false);
					setShowPaymentModal(false);
					setShow(false);
					setTimeout(() => setStagedChange(null), 500);
				}}
				title='Confirm Subscription Change'
				message='Are you sure you want to change your subscription? Changes will apply immediately.'
			/>

			<StripeCheckoutModal
				showPaymentModal={showPaymentModal}
				payload={payload}
				setShow={setShowPaymentModal}
				setStagedChange={setStagedChange}
				onComplete={() => {
					setShowPaymentModal(false);
					API.hasPaymentMethod(
						res => {
							if (res && res?.ok === true && res?.last4) {
								setLast4(res?.last4);
							}
						},
						toast.error,
						router
					);
					setContinued(true);
				}}
			/>

			<Invoice
				continued={continued}
				session={stagedChange}
				show={show}
				last4={last4}
				cancelFunction={() => setShow(false)}
				confirmFunction={async () => {
					return new Promise((resolve, reject) => {
						try {
							API.hasPaymentMethod(
								res => {
									if (res && res?.ok === true) {
										setLast4(res?.last4);
										setContinued(true);
										setShowConfirmModal(true);
									} else if (payload.plan === SubscriptionPlan.FREE) {
										setContinued(true);
										setShowConfirmModal(true);
									} else {
										resolve(null);
										setShowPaymentModal(true);
									}
								},
								toast.error,
								router
							);
						} catch (e) {
							console.error(e);
							toast.error('Error updating subscription - please contact support');
							reject(e);
						}
					});
				}}
			/>
		</div>
	);
}

export async function getServerSideProps({
	req,
	res,
	query,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}

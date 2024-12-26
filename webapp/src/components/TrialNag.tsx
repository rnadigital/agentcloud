import { SparklesIcon } from '@heroicons/react/20/solid';
import classNames from 'components/ClassNames';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SubscriptionPlan } from 'struct/billing';

//Note: similar to BillingBanner
export default function TrialNag() {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const currentOrg = account?.orgs?.find(o => o.id === account?.currentOrg);
	const { stripePlan, stripeEndsAt, stripeCancelled, stripeTrial } = currentOrg?.stripe || {};

	const now = Date.now();
	const daysRemaining = Math.floor((stripeEndsAt - now) / 86400000);
	const router = useRouter();
	console.log(stripePlan, stripeEndsAt, stripeCancelled, stripeTrial);

	//Dont show banner if
	if (
		!stripePlan ||
		!stripeEndsAt || // the stripe object doesnt have the plan or end date
		(!stripeTrial && stripePlan !== SubscriptionPlan.FREE)
	) {
		// or they aren't on a trial AND not on free
		return null;
	}

	return (
		<div
			suppressHydrationWarning
			className={
				'flex flex-col p-3 mt-3 space-y-2 w-full text-white rounded shadow -ms-1 bg-slate-800'
			}
		>
			{stripeCancelled ||
				(stripeTrial && (
					<div className='flex flex-row'>
						<SparklesIcon className='w-5 h-5 me-2' />
						{stripeCancelled ? (
							<h3 className='me-2'>Cancels in {daysRemaining} days.</h3>
						) : (
							stripeTrial && <h2 className='me-2'>Trial ends in {daysRemaining} days.</h2>
						)}
					</div>
				))}
			{stripePlan === SubscriptionPlan.FREE ? (
				<span className='text-sm text-center'>You are currently on the Free plan.</span>
			) : (
				<span className='text-sm text-center'>You are on a free trial of {stripePlan}.</span>
			)}
			<Link href='/billing'>
				<button
					className={classNames(
						'w-full justify-center inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed',
						stripePlan === SubscriptionPlan.FREE
							? 'bg-orange-400 hover:bg-orange-500'
							: 'bg-indigo-500 hover:bg-indigo-500'
					)}
				>
					{stripePlan === SubscriptionPlan.FREE ? 'Upgrade' : 'Billing'}
				</button>
			</Link>
		</div>
	);
}

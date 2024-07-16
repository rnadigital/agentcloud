import {
	SparklesIcon,
} from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SubscriptionPlan } from 'struct/billing';

//Note: similar to BillingBanner
export default function TrialNag({ stripePlan, stripeEndsAt, stripeCancelled }) {

	const now = Date.now();
	const daysRemaining = Math.floor((stripeEndsAt - now) / 86400000);
	const router = useRouter();

	//Dont show banner if
	if (!stripePlan || !stripeEndsAt // the stripe object doesnt have the plan or end date
		|| stripeEndsAt <= now  // its already past the end date
		|| stripePlan === SubscriptionPlan.FREE) { // or they are on the free plan
		return null;
	}

	return (
		<div suppressHydrationWarning className={'p-3 mb-2 -ms-1 flex flex-col space-y-2 w-full rounded shadow text-white bg-slate-800'}>
			<div className='flex flex-row'>
				<SparklesIcon className='h-5 w-5 me-2' />
				{stripeCancelled
					? <h3 className='me-2'>
					Subscription expiring in {daysRemaining} days.
					</h3>
					: <h2 className='me-2'>
					Trial ends in {daysRemaining} days.
					</h2>}
			</div>
			<span className='text-sm'>You are on a free trial of {stripePlan}.</span>
			<Link href='/billing'>
				<button
					className='w-full justify-center inline-flex items-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
				>
					Billing
				</button>
			</Link>
		</div>
	);

}

import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';
import { SubscriptionPlan } from 'struct/billing';

export default function BillingBanner({ stripePlan, stripeEndsAt, stripeCancelled }) {
	const now = Date.now();
	const daysRemaining = Math.floor((stripeEndsAt - now) / 86400000);
	const router = useRouter();

	//Dont show banner if
	if (
		router.asPath == '/billing' || // they are on the billing page
		!stripePlan ||
		!stripeEndsAt || // the stripe object doesnt have the plan or end date
		stripeEndsAt <= now || // its already past the end date
		daysRemaining > 7 || // there are still more than 30 days
		stripePlan === SubscriptionPlan.FREE
	) {
		// or they are on the free plan
		return null;
	}

	return (
		<div
			suppressHydrationWarning
			className={`sticky z-50 block top-0 text-center space-y-2 text-sm py-1 w-full bg-${stripeCancelled ? 'orange' : 'indigo'}-500 fixed top-0 text-white`}
		>
			{stripeCancelled ? (
				<span className='me-2'>
					Your {stripePlan} subscription is cancelled and will end in {daysRemaining} days (
					{new Date(stripeEndsAt).toDateString()}).
				</span>
			) : (
				<span className='me-2'>
					Your free trial of {stripePlan} ends in {daysRemaining} days (
					{new Date(stripeEndsAt).toDateString()}).
				</span>
			)}
			<Link
				href={'/billing'}
				className={`px-2 py-[0.5px] me-2 ${stripeCancelled ? 'bg-orange-200' : 'bg-indigo-500'} text-${stripeCancelled ? 'orange' : 'indigo'}-700 border ${stripeCancelled ? 'border-orange-700' : 'border-indigo'} text-sm rounded-lg`}
			>
				Manage Subscription
			</Link>
		</div>
	);
}

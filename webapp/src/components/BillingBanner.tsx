import Link from 'next/link';
import React from 'react';

export default function BillingBanner({ stripePlan, stripeEndsAt, stripeCancelled }) {
	const now = Date.now();
	const daysRemaining = Math.floor((stripeEndsAt - now) / 86400000);

	if (!stripePlan || !stripeEndsAt || stripeEndsAt <= now || daysRemaining > 30) {
		return null;
	}

	return (
		<div suppressHydrationWarning className={`sticky z-50 block top-0 text-center space-y-2 text-sm py-1 w-full bg-${stripeCancelled ? 'orange' : 'indigo'}-500 fixed top-0 text-white`}>
			{stripeCancelled
				? <span className='me-2'>
					Your {stripePlan} subscription is cancelled and will end in {daysRemaining} days ({new Date(stripeEndsAt).toDateString()}).
				</span>
				: <span className='me-2'>
					Your free trial of {stripePlan} ends in {daysRemaining} days ({new Date(stripeEndsAt).toDateString()}).
				</span>}
			<Link href={'/billing'} className={`px-2 py-[0.5px] me-2 bg-${stripeCancelled ? 'orange-200' : 'indigo-500'} text-${stripeCancelled ? 'orange' : 'indigo'}-700 border border-${stripeCancelled ? 'orange-700' : 'indigo'} text-sm rounded-lg`}>
				Manage Subscription
			</Link>
		</div>
	);

}

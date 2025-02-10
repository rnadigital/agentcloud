import { SparklesIcon } from '@heroicons/react/20/solid';
import { Sub } from '@radix-ui/react-dropdown-menu';
import classNames from 'components/ClassNames';
import { useAccountContext } from 'context/account';
import { Progress } from 'modules/components/ui/progress';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { SubscriptionPlan } from 'struct/billing';

//Note: similar to BillingBanner
export default function TrialNag() {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const { currentOrgDateCreated } = account || {};
	const { stripePlan, stripeTrial, stripeEndsAt, stripeCancelled } = account?.stripe || {};

	const now = Date.now();
	const orgCreatedDate = new Date(currentOrgDateCreated).getTime();
	const totalTrialDays = Math.floor((stripeEndsAt - orgCreatedDate) / 86400000);
	const daysUsed = Math.floor((now - orgCreatedDate) / 86400000);
	const percentageUsed = Math.min(100, Math.round((daysUsed / totalTrialDays) * 100));

	if (
		!stripePlan ||
		!stripeEndsAt || // the stripe object doesnt have the plan or end date
		(!stripeTrial && stripePlan !== SubscriptionPlan.FREE)
	) {
		// or they aren't on a trial AND not on free
		return null;
	}

	const plan =
		stripePlan === SubscriptionPlan.FREE
			? 'Free Plan'
			: stripeTrial
				? `${stripePlan} Plan (Trial)`
				: `${stripePlan} Plan`;

	return (
		<div className='w-full bg-background rounded-lg p-4 mt-2 flex text-foreground flex-col gap-2'>
			<p className='font-bold'>{plan}</p>
			<p className='text-xs text-gray-500'>Until {new Date(stripeEndsAt).toLocaleDateString()}</p>
			<Progress value={percentageUsed} />
			{(stripeTrial || stripePlan === SubscriptionPlan.FREE) && (
				<Link href='/billing'>
					<p className='text-sm text-[#4f46e5] cursor-pointer font-bold'>Upgrade your plan</p>
				</Link>
			)}
		</div>
	);
}

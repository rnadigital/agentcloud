import { PlusIcon } from '@heroicons/react/20/solid';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PageTitleWithNewButton({ onClick, list, title, buttonText, href }: { onClick?: any, list?: any[], title?: string, buttonText?: string, href?: string }) {
	const router = useRouter();
	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const b = <button
		onClick={onClick}
		type='button'
		className='inline-flex items-center rounded-md bg-indigo-500 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
	>
		<PlusIcon className='-ml-0.5 mr-1.5 h-5 w-5' aria-hidden='true' />
		{buttonText}
	</button>;
	return (<div className='border-b pb-2 my-2 dark:border-slate-600 flex justify-between'>
		<h3 className='pl-2 font-semibold text-gray-900 dark:text-white'>{title}</h3>
		{buttonText
			? href
				?	<Link href={`/${resourceSlug}${href}`}>
					{b}	
				</Link>
				: b
			: null}
	</div>);
}

import { PlusIcon } from '@heroicons/react/20/solid';
import { FaSearch } from 'react-icons/fa';
import { useAccountContext } from 'context/account';
import Link from 'next/link';
import { useRouter } from 'next/router';

export default function PageTitleWithNewButton({
	onClick,
	list,
	title,
	buttonText,
	href,
	showButton = true,
	slug = true,
	searchQuery,
	setSearchQuery
}: {
	onClick?: any;
	list?: any[];
	title?: string;
	buttonText?: string;
	showButton?: boolean;
	href?: string;
	slug?: boolean;
	searchQuery: string;
	setSearchQuery: any;
}) {
	const router = useRouter();
	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;

	const b = (
		<button
			onClick={onClick}
			type='button'
			className='inline-flex items-center rounded-md bg-primary px-4 py-2 h-full text-sm text-white shadow-sm hover:bg-primary/90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary disabled:bg-muted disabled:text-muted-foreground disabled:cursor-not-allowed'>
			<PlusIcon
				className='-ml-0.5 mr-1.5 h-3 w-3 rounded-full border border-white'
				aria-hidden='true'
			/>
			{buttonText}
		</button>
	);
	return (
		<div className='pb-2 my-2 flex items-end justify-between'>
			<h3 className='pl-2 font-semibold text-foreground'>{title}</h3>
			<div className='flex items-center space-x-5 h-[2.10rem]'>
				<div className='relative h-full'>
					<FaSearch className='absolute left-3 top-1/2 mt-[1px] transform -translate-y-1/2 h-4 w-4 text-muted-foreground' />
					<input
						type='text'
						value={searchQuery}
						onChange={e => setSearchQuery(e.target.value)}
						placeholder='Search Member'
						className='pt-[0.40rem] pl-9 border border-input rounded-md h-full w-[200px] bg-background text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring'
					/>
				</div>
				{showButton && (
					<>
						{slug && (
							<>
								{buttonText ? href ? <Link href={`/${resourceSlug}${href}`}>{b}</Link> : b : null}
							</>
						)}
						{!slug && <>{buttonText ? href ? <Link href={`/${href}`}>{b}</Link> : b : null}</>}
					</>
				)}
			</div>
		</div>
	);
}

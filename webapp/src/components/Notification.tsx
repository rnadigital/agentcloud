import { XMarkIcon } from '@heroicons/react/24/outline';
import { useNotificationContext } from 'context/notifications';
import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useState } from 'react';
import { List } from 'react-content-loader';

// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <List height={100} width={290} />,
	ssr: false
});

export function Notification({ index, title, description, date, seen, _id, markSeen }) {
	const [gone, setGone] = useState(false);
	return (
		<div
			className={`p-4 ${index === 0 || gone ? '' : 'border-t'} ${seen ? 'bg-gray-100' : 'bg-white dark:bg-slate-800'} transition-all duration-500 max-h-[500px] overflow-hidden ${gone ? 'max-h-0 opacity-0' : ''} dark:text-white`}
		>
			{!seen && (
				<div className='ml-3 flex h-7 items-center cursor-pointer rounded-full right-5 absolute w-4 h-4'>
					<button
						type='button'
						className='relative rounded-md bg-white dark:bg-slate-800 text-gray-400 hover:text-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2'
						onClick={() => {
							setGone(true);
							markSeen(_id);
						}}
					>
						<span className='absolute -inset-2.5' />
						<span className='sr-only'>Close panel</span>
						<XMarkIcon className='h-5 w-5' aria-hidden='true' />
					</button>
				</div>
			)}
			<h5 className='text-md font-bold'>{title}</h5>
			<Markdown className={'markdown-content'}>{description}</Markdown>
			<p className='text-xs text-gray-500'>{new Date(date).toLocaleString()}</p>
		</div>
	);
}

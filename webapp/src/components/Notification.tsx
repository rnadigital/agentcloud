import dynamic from 'next/dynamic';
import Link from 'next/link';

// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false,
});

export function Notification({ title, description, date, seen }) {
	return (
		<div className={`p-4 border-b ${seen ? 'bg-gray-100' : 'bg-white'}`}>
			<Link href='/'> {/*TODO: all this shi */}
				<h5 className='text-md font-bold'>{title}</h5>
				<Markdown
					className={'markdown-content'}
				>
					{description}
				</Markdown>
				<p className='text-xs text-gray-500'>{new Date(date).toLocaleString()}</p>
			</Link>
		</div>
	);
}

export function NotificationBox({ notifications }) {
	return (
		<div className='max-w-sm max-h-20 w-full bg-white shadow-md rounded-lg overflow-hidden'>
			{notifications.map((notification, index) => (
				<Notification key={index} {...notification} />
			))}
		</div>
	);
}

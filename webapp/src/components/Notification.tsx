import Link from 'next/link';

export function Notification({ title, description, date, seen }) {
	console.log(title, description, date, seen);
	return (
		<div className={`p-4 border-b ${seen ? 'bg-gray-100' : 'bg-white'}`}>
			<Link href='/'> {/*TODO: all this shi */}
				<h5 className='text-md font-bold'>{title}</h5>
				<p className='text-sm'>{description}</p>
				<p className='text-xs text-gray-500'>{new Date(date).toLocaleDateString()}</p>
			</Link>
		</div>
	);
}

export function NotificationBox({ notifications }) {
	return (
		<div className='max-w-sm w-full bg-white shadow-md rounded-lg overflow-hidden'>
			{notifications.map((notification, index) => (
				<Notification key={index} {...notification} />
			))}
		</div>
	);
}

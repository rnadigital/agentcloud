// import { useAccountContext } from '../../context/account';
import { PlayIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/router';
import Blockies from 'react-blockies';

export default function AppCard({ app, startSession }) {
	const { description, name, icon } = app;
	const router = useRouter();
	const { resourceSlug } = router.query;
	return (
		<div className='xs:w-full max-w-sm rounded-xl overflow-hidden bg-gray-50 px-6 py-4 flex flex-col space-between min-h-50'>
			<a className='h-full' href={`/${resourceSlug}/app/${app._id}/edit`}>
				<div className='flex items-center justify-center p-4'>
					{icon && icon.path
						? <img className='w-16 h-16 rounded-full' src={icon.path} alt={`${name} icon`} />
						: <Blockies className='rounded-full' seed={app.name} size={16} />}
				</div>
				<div>
					<div className='font-bold text-xl mb-2'>{name}</div>
					<p className={`text-gray-700 text-base max-h-20 overflow-hidden ${description?.length > 20 ? 'overlay-gradient light' : ''}`}>
						{description}
					</p>
				</div>
			</a>
			<div className='flex flex-col lg:flex-row justify-between pt-5 gap-4	grid-cols-1 xl:grid-cols-2'>
				<div className='w-full xl:w-min text-sm text-gray-600'>
					{app.author ? `By ${app.author}` : 'AgentCloud App'}
				</div>
				<button
					className='rounded-md xl:rounded xl:w-24  h-10 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full inline-flex items-center'
					onClick={() => {
						startSession(app._id);
					}}
				>
					<PlayIcon className='h-5 w-5 mr-2' />
					Play
				</button>
			</div>
		</div>
	);
}

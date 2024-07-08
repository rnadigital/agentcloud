// import { useAccountContext } from '../../context/account';
import { PlayIcon } from '@heroicons/react/20/solid';
import AgentAvatar from 'components/AgentAvatar';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/router';
import Blockies from 'react-blockies';
import { AppType } from 'struct/app';

// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content p-2'>Loading...</p>,
	ssr: false,
});

export default function AppCard({ app, startSession }) {
	const { description, name, icon } = app;
	const router = useRouter();
	const { resourceSlug } = router.query;
	return (
		<div className='w-full max-w-sm rounded-xl overflow-hidden bg-gray-50 dark:bg-slate-800 px-6 py-4 flex flex-col space-between min-h-50'>
			<a className='h-full' href={`/${resourceSlug}/app/${app._id}/edit`}>
				<span className={`px-2 py-[0.5px] border text-sm rounded-lg ${app.type === AppType.CHAT
					? 'bg-blue-100 text-blue-800 border-blue-300'
					: 'bg-green-100 text-green-800 border-green-300'}`}>
					{app.type === AppType.CHAT ? 'Chat' : 'Process'}
				</span>
				<div className='flex items-center justify-center p-4'>
					<AgentAvatar agent={app} size={20} />
				</div>
				<div>
					<div className='font-bold text-xl mb-2'>{name}</div>
					<p className={'text-gray-700 text-base max-h-20 overflow-hidden dark:text-white'}>
						{description}
					</p>
				</div>
			</a>
			<div className='flex flex-col flex-wrap justify-between pt-5 gap-4 grid-cols-1 xl:grid-cols-2'>
				<div className='w-full text-sm text-gray-600 dark:text-gray-400'>
					{app.author ? `By ${app.author}` : 'AgentCloud App'}
				</div>
				<button
					className='rounded-md xl:w-24 h-10 bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded-full inline-flex items-center self-end'
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

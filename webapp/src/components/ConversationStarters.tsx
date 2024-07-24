import * as API from '@api';
import { ArrowUpIcon } from '@heroicons/react/20/solid';
import { useRouter } from 'next/router';
import React from 'react';
import { toast } from 'react-toastify';

const ConversationStarters = ({ session, app, sendMessage, conversationStarters }) => {
	const router = useRouter();
	return (
		<div className='flex space-x-4'>
			{conversationStarters.map((starter, index) => (
				<div
					key={index}
					className='flex flex-col space-x-2 p-4 bg-white rounded shadow cursor-pointer text-sm max-w-[250px]'
					onClick={async () => {
						if (session != null) {
							sendMessage(starter);
						} else {
							const res = await API.publicStartApp(
								{
									resourceSlug: app?.teamId,
									id: app?._id
								},
								null,
								toast.error,
								null
							);
							console.log('res', res);
							res.redirect && router.push(`/s${res.redirect}`, null, { shallow: true });
						}
					}}
				>
					<ArrowUpIcon className='w-5 text-gray-400 pb-2' />
					<span className='text-gray-600'>{starter}</span>
				</div>
			))}
		</div>
	);
};

export default ConversationStarters;

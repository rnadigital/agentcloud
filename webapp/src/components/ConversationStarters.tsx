import * as API from '@api';
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
					className='bg-white rounded shadow cursor-pointer text-sm max-w-[250px] truncate py-1 px-2'
					onClick={async () => {
						if (session != null) {
							sendMessage(starter);
						}
					}}
				>
					<span className='text-gray-600'>{starter}</span>
				</div>
			))}
		</div>
	);
};

export default ConversationStarters;

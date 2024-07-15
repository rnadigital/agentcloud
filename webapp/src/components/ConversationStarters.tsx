import { ArrowUpIcon } from '@heroicons/react/20/solid';
import React from 'react';

const ConversationStarters = ({ sendMessage, conversationStarters }) => {
	return (
		<div className='flex space-x-4'>
			{conversationStarters.map((starter, index) => (
				<div
					key={index}
					className='flex flex-col space-x-2 p-4 bg-white rounded shadow cursor-pointer text-sm max-w-[250px]'
					onClick={() => sendMessage(starter)}
				>
					<ArrowUpIcon className='w-5 text-gray-400 pb-2' />
					<span className='text-gray-600'>{starter}</span>
				</div>
			))}
		</div>
	);
};

export default ConversationStarters;

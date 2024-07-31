const ConversationStarters = ({ sendMessage, conversationStarters }) => {
	return (
		<div className='flex space-x-4'>
			{conversationStarters.map((starter, index) => (
				<div
					key={index}
					className='bg-white rounded shadow cursor-pointer text-sm max-w-[250px] truncate p-1 px-2'
					onClick={() => sendMessage(starter)}
				>
					<span className='text-gray-600'>{starter}</span>
				</div>
			))}
		</div>
	);
};

export default ConversationStarters;

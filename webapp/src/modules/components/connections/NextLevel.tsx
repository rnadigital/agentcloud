import { Button } from '@react-email/components';
import { CirclePlus, MessagesSquare, Share2, SquareTerminal } from 'lucide-react';
import React, { useState } from 'react';
import router from 'router';

import { Dialog, DialogContent, DialogTrigger } from '../ui/dialog';

const NextLevel = () => {
	const [isDialogOpen, setIsDialogOpen] = useState(false);
	return (
		<Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
			<DialogTrigger>
				<button className='flex items-center gap-2 bg-gradient-to-r from-[#4F46E5] to-[#612D89] text-white py-2.5 px-4 rounded-lg'>
					<CirclePlus width={10.5} />
					<p className='font-semibold text-sm'>New Connection</p>
				</button>
			</DialogTrigger>
			<DialogContent className='rounded-lg w-[95%] lg:min-w-[800px] text-foreground'>
				<div className='p-2 lg:p-6 text-center space-y-6'>
					<div className='text-sm p-4 rounded-md text-[#4937a6] bg-purple-50 flex flex-col lg:flex-row gap-2 items-center justify-center'>
						<p className='font-bold'>
							🎉 Your vector database is all set, and your data sources are wired —
						</p>
						<p>time to query like a pro!</p>
					</div>
					<div className='border border-indigo-200 p-10 relative rounded-lg bg-gradient-to-b from-white to-indigo-50 flex flex-col items-center justify-between gap-4 '>
						<h2 className='text-l font-bold statica lg:absolute lg:-top-4 lg:left-1/2 transform lg:-translate-x-1/2 bg-white text-[#612D89]'>
							✨ Take it to the Next Level ✨
						</h2>
						<div className='gap-6 mt-4 grid grid-cols-1 lg:grid-cols-3 md:grid-cols-2'>
							<div className='text-sm text-gray-700 flex flex-col items-center gap-2 w-full my-2'>
								<MessagesSquare width={20} color='#3F38B7' />
								<p className='font-medium'>Turn Your Data Into Powerful Chat Apps!</p>
							</div>
							<div className='text-sm text-gray-700 flex flex-col items-center gap-2 w-full my-2'>
								<SquareTerminal width={20} color='#3F38B7' />
								<p className='font-medium'>Embed Your Chat App Seamlessly using an iframe</p>
							</div>
							<div className='text-sm text-gray-700 flex flex-col items-center gap-2 w-full my-2'>
								<Share2 width={20} color='#3F38B7' />
								<p className='font-medium'>Share App with your team to quickly query data</p>
							</div>
						</div>

						<Button
							onClick={() => setIsDialogOpen(false)}
							className='flex items-center gap-2 bg-gradient-to-r from-purple-500 to-purple-900 text-white py-2.5 px-4 rounded-lg w-full'
						>
							Create Chat App
						</Button>
					</div>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default NextLevel;

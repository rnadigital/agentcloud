import { CheckIcon } from '@heroicons/react/20/solid';
import Link from 'next/link';
import { useRouter } from 'next/router';
import React from 'react';

export default function TaskCards({ tasks }: { tasks: any[] }) {
	const router = useRouter();
	const { resourceSlug } = router.query;

	return (
		<div className='grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5'>
			{tasks.map((task) => (
				<div key={task._id} className='relative rounded-lg border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4 shadow-sm'>
					<div className='flex items-center justify-between'>
						<h3 className='text-sm font-medium truncate'>
							<Link href={`/${resourceSlug}/task/${task._id}/edit`}>
								&quot;<em>{task.description}</em>&quot;
							</Link>
						</h3>
						{/*<span title="Async Execution" className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
							<CheckIcon className="h-4 w-4" aria-hidden="true" />
						</span>*/}
					</div>
				</div>
			))}
		</div>
	);
}


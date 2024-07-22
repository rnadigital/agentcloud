import { CheckCircleIcon } from '@heroicons/react/24/outline';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React from 'react';

export default function Redirect() {
	const router = useRouter();
	const { to } = router.query;
	if (typeof window !== 'undefined') {
		router.push((to as string) || '/login');
	}

	return (
		<>
			<Head>
				<title>Redirecting...</title>
			</Head>

			<div className='flex min-h-full flex-1 flex-col justify-center py-12 sm:px-6 lg:px-8'>
				<div className='mt-10 sm:mx-auto sm:w-full sm:max-w-[480px]'>
					<div className='bg-white px-6 py-12 shadow sm:rounded-lg sm:px-12'>
						<div className='w-16 mx-auto'>
							<CheckCircleIcon />
						</div>
						<p className='text-center'>Redirecting...</p>
					</div>
				</div>
			</div>
		</>
	);
}

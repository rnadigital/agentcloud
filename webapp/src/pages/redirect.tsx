import Head from 'next/head';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/router';
// TODO: Remove once https://github.com/vercel/next.js/issues/52216 is resolved.
// `next/image` seems to be affected by a default + named export bundling bug.
let ResolvedImage: any = Image;
if ('default' in ResolvedImage) {
	ResolvedImage = ResolvedImage.default;
}
import {
	CheckCircleIcon,
} from '@heroicons/react/24/outline';
import React, { useEffect, useState } from 'react';

import * as API from '../api';
import ErrorAlert from '../components/ErrorAlert';

export default function Redirect() {

	const router = useRouter();
	const [verified, setVerified] = useState(null);
	const [error, setError] = useState();
	const { to } = router.query;
	if (typeof window !== 'undefined') {
		router.push(to as string || '/login');
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
						<p className='text-center'>Login successful, redirecting...</p>
					</div>
				</div>
			</div>

		</>
	);

}

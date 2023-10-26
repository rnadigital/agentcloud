import React, { useState, useEffect } from 'react';
import Head from 'next/head';
import Link from 'next/link';
import * as API from '../../api';
import { useRouter } from 'next/router';
import { useAccountContext } from '../../context/account';
import SessionCards from '../../components/SessionCards';

const people = [];

export default function Home(props) {

	const [accountContext]: any = useAccountContext();
	const { teamName, account, csrf } = accountContext as any;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { sessions } = state;

	useEffect(() => {
		if (!sessions) {
			API.getHome({ resourceSlug: account.currentTeam }, dispatch, setError, router);
		}
	}, []);
	
	if (!sessions) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>Home - {teamName}</title>
		</Head>

		<div className='pb-2 my-2'>
			<h3 className='pl-2 font-semibold text-gray-900'>Active Sessions</h3>
		</div>

		<SessionCards sessions={sessions} />
		
		<div className='pb-2 my-2 pt-8'>
			<h3 className='pl-2 font-semibold text-gray-900'>Session History</h3>
		</div>

		<div className='flow-root'>
			<div className='overflow-x-auto -mx-6 -my-2'>
				<div className='inline-block min-w-full py-2 align-middle sm:px-6 lg:px-8'>
					<table className='min-w-full divide-y divide-gray-300'>
						<thead>
							<tr>
								<th scope='col' className='py-3.5 pl-4 pr-3 text-left text-sm font-semibold text-gray-900 sm:pl-0'>
									Team
								</th>
								<th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
									Task
								</th>
								<th scope='col' className='px-3 py-3.5 text-left text-sm font-semibold text-gray-900'>
									Status
								</th>
								<th scope='col' className='relative py-3.5 pl-3 pr-4 sm:pr-0'>
									<span className='sr-only'>View</span>
								</th>
							</tr>
						</thead>
						<tbody className='divide-y divide-gray-200 bg-white'>
							{people.map((person) => (
								<tr key={person.email}>
									<td className='whitespace-nowrap py-5 pl-4 pr-3 text-sm sm:pl-0'>
										<div className='flex items-center'>
											<div className='h-11 w-11 flex-shrink-0'>
												<img className='h-11 w-11 rounded-full' src={person.image} alt='' />
											</div>
											<div className='ml-4'>
												<div className='font-medium text-gray-900'>{person.name}</div>
												<div className='mt-1 text-gray-500'>{person.email}</div>
											</div>
										</div>
									</td>
									<td className='whitespace-nowrap px-3 py-5 text-sm text-gray-500'>
										<div className='text-gray-900'>{person.title}</div>
										<div className='mt-1 text-gray-500'>{person.department}</div>
									</td>
									<td className='whitespace-nowrap px-3 py-5 text-sm text-gray-500'>
										<span className='inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20'>
                        Active
										</span>
									</td>
									<td className='relative whitespace-nowrap py-5 pl-3 pr-4 text-right text-sm font-medium sm:pr-0'>
										<a href='#' className='text-indigo-600 hover:text-indigo-900'>
					                        Edit<span className='sr-only'>, {person.name}</span>
										</a>
									</td>
								</tr>
							))}
						</tbody>
					</table>
				</div>
			</div>
		</div>

	</>);
}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data }));
}

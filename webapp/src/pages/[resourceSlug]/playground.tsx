import * as API from '@api';
import StartSessionChatbox from 'components/StartSessionChatbox';
import StartSessionForm from 'components/StartSessionForm';
import { useAccountContext } from 'context/account';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import Blockies from 'react-blockies';

export default function Playground(props) {

	const [accountContext]: any = useAccountContext();
	const { account, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { sessions, crews, agents } = state;
	const [open, setOpen] = useState(false);

	async function fetchSessions() {
		await API.getSessions({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchSessions();
	}, [resourceSlug]);

	if (!sessions) {
		return 'Loading...'; //TODO: loader
	}

	return (<>

		<Head>
			<title>{`Playground - ${teamName}`}</title>
		</Head>

		{/*<div className='flex flex-col -mx-3 sm:-mx-6 lg:-mx-8 -my-10 flex flex-col flex-1' style={{ maxHeight: 'calc(100vh - 110px)' }}>
			<div className='flex flex-col mt-auto'>
				<div className='flex flex-row justify-center border-t pt-3 dark:border-slate-600' />
				<div className='flex flex-row justify-center pb-3'>
					<div className='flex items-start space-x-4 basis-1/2'>
						{account && <div className='min-w-max w-9 h-9 rounded-full flex items-center justify-center select-none mt-auto mb-6'>
							<span className={'overflow-hidden w-8 h-8 rounded-full text-center font-bold ring-gray-300 ring-1'}>
								<Blockies seed={account.name} />
							</span>
						</div>}
						<div className='min-w-0 flex-1 h-full mb-[6px]'>
							<StartSessionChatbox crews={crews} agents={agents} setOpen={setOpen} fetchSessions={fetchSessions} inverted={true} />
						</div>
					</div>
				</div>
			</div>
		</div>*/}

		<span className='sm: w-full md:w-1/2 xl:w-1/3'>
			<p className='text-sm mb-1'>Run an App:</p>
			<StartSessionForm crews={crews} agents={agents} setOpen={setOpen} fetchSessions={fetchSessions} />
		</span>

	</>);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
};

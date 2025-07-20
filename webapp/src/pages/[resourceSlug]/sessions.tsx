import * as API from '@api';
import PreviewSessionList from 'components/PreviewSessionList';
import { SessionTable } from 'components/sessions/SessionTable';
import { useAccountContext } from 'context/account';
import { useSocketContext } from 'context/socket';
import { SessionJSONReturnType } from 'controllers/session';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { toast } from 'react-toastify';

const SessionPage = () => {
	const [accountContext]: any = useAccountContext();
	const [_, __, sessionTrigger]: any = useSocketContext();
	const { account, teamName, csrf } = accountContext as any;
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const [state, setState] = useState<SessionJSONReturnType>();
	const [lastFetchTime, setLastFetchTime] = useState(0);

	async function fetchSessions(noLoading = false, fromStart = false) {
		const now = Date.now();
		if (now - lastFetchTime < 250) {
			// throttle api calls
			return;
		}
		setLastFetchTime(now);
		const start = Date.now();
		try {
			await API.getSessions(
				{
					resourceSlug,
					before: null
				},
				res => {
					setState(prevState => {
						const newSessions = (prevState?.sessions || [])
							.concat(
								res?.sessions?.filter(s => {
									return !prevState?.sessions || !prevState?.sessions?.find(ps => ps._id === s._id);
								})
							)
							.sort((a, b) => {
								return new Date(b.startDate).getTime() - new Date(a.startDate).getTime();
							});
						return {
							...prevState,
							sessions: newSessions
						};
					});
				},
				null,
				router
			);
		} finally {
			!noLoading && setTimeout(() => {}, 500 - (Date.now() - start));
		}
	}

	const deleteSession = async sessionId => {
		API.deleteSession(
			{
				_csrf: csrf,
				resourceSlug,
				sessionId
			},
			() => {
				setState(prevState => ({
					...prevState,
					sessions: prevState?.sessions?.filter(s => s._id !== sessionId)
				}));
				toast('Deleted session');
				if (router.asPath.includes(`/session/${sessionId}`)) {
					return router.push(`/${resourceSlug}/apps`);
				}
			},
			() => {
				toast.error('Error deleting session');
			},
			router
		);
	};

	useEffect(() => {
		fetchSessions();
	}, []);

	useEffect(() => {
		fetchSessions(true, true);
	}, [sessionTrigger]);

	useEffect(() => {
		const interval = setInterval(() => {
			fetchSessions(true, true);
		}, 30000);
		return () => {
			clearInterval(interval);
		};
	}, []);

	if (!resourceSlug) {
		return null;
	}

	return (
		<div>
			<Head>
				<title>{`Variables - ${teamName}`}</title>
			</Head>

			<h1 className='font-semibold text-2xl text-foreground'>Sessions</h1>

			<SessionTable sessions={state?.sessions || []} onDelete={deleteSession} />
		</div>
	);
};

export default SessionPage;

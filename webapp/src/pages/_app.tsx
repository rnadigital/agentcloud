import './globals.css';
import 'nprogress/nprogress.css';
import 'react-toastify/dist/ReactToastify.css';

import Layout from 'components/Layout';
import { AccountWrapper } from 'context/account';
import { ChatWrapper } from 'context/chat';
import { FlowWrapper } from 'context/flow';
import { NotificationWrapper } from 'context/notifications';
import { SocketWrapper } from 'context/socket';
import { StepWrapper } from 'context/stepwrapper';
import Head from 'next/head';
import Router from 'next/router';
import NProgress from 'nprogress';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';
import { useEffect } from 'react';
import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';

// Check that PostHog is client-side (used to handle Next.js SSR)
if (typeof window !== 'undefined') {
	posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
		api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
		// Enable debug mode in development
		loaded: (posthog) => {
			if (process.env.NODE_ENV === 'development') {
				posthog.debug();
			}
		},
		capture_pageview: false // Disable automatic pageview capture, as we capture manually
	});
}
  
NProgress.configure({ showSpinner: false });
Router.events.on('routeChangeStart', (url) => NProgress.start());
Router.events.on('routeChangeComplete', (url) => NProgress.done());
Router.events.on('routeChangeError', (_url) => NProgress.done());

export default function App({ Component, pageProps }) {

	useEffect(() => {
		if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
			posthog.debug(false);
			// Track page views
			const handleRouteChange = () => posthog?.capture('$pageview');
			Router.events.on('routeChangeComplete', handleRouteChange);
			return () => {
				Router.events.off('routeChangeComplete', handleRouteChange);
			};
		}
	}, []);

	const [pagePropsState] = useState(pageProps);
	return (
		<PostHogProvider client={posthog}>
			<AccountWrapper pageProps={pagePropsState}>
				<ChatWrapper>
					<SocketWrapper>
						<NotificationWrapper>
							<StepWrapper>
								<FlowWrapper>
									<ToastContainer
										progressClassName='toast-container'
										bodyClassName='toast-body'
										theme='colored'
										position='bottom-right'
										autoClose={3000}
										newestOnTop={true}
										pauseOnFocusLoss={false}
										pauseOnHover={false}
										hideProgressBar={true}
										limit={3}
									/>
									<Layout {...pageProps}>
										<style>
											{''}
										</style>
										<Component {...pageProps} />
									</Layout>
								</FlowWrapper>
							</StepWrapper>
						</NotificationWrapper>
					</SocketWrapper>
				</ChatWrapper>
			</AccountWrapper>
		</PostHogProvider>
	);
}

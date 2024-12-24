import './globals.css';
import 'nprogress/nprogress.css';
import 'react-toastify/dist/ReactToastify.css';
import 'tippy.js/dist/tippy.css';
import 'tippy.js/themes/material.css';

import Layout from 'components/Layout2';
import { AccountWrapper } from 'context/account';
import { ChatWrapper } from 'context/chat';
import { DeveloperWrapper } from 'context/developer';
import { NotificationWrapper } from 'context/notifications';
import { SocketWrapper } from 'context/socket';
import { StepWrapper } from 'context/stepwrapper';
import { ThemeProvider } from 'context/themecontext';
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
		capture_pageview: false // Disable automatic pageview capture, as we capture manually
	});
}

NProgress.configure({ showSpinner: false });
Router.events.on('routeChangeStart', url => NProgress.start());
Router.events.on('routeChangeComplete', url => NProgress.done());
Router.events.on('routeChangeError', _url => NProgress.done());

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
			<DeveloperWrapper>
				<AccountWrapper pageProps={pagePropsState}>
					<ChatWrapper>
						<SocketWrapper>
							<NotificationWrapper>
								<StepWrapper>
									<ToastContainer
										progressClassName='toast-container'
										bodyClassName='toast-body'
										theme='colored'
										position='bottom-right'
										autoClose={3000}
										newestOnTop={true}
										pauseOnFocusLoss={false}
										pauseOnHover={true}
										hideProgressBar={true}
										limit={3}
									/>
									<ThemeProvider>
										<Layout {...pageProps}>
											<style>{''}</style>
											<Component {...pageProps} />
										</Layout>
									</ThemeProvider>
								</StepWrapper>
							</NotificationWrapper>
						</SocketWrapper>
					</ChatWrapper>
				</AccountWrapper>
			</DeveloperWrapper>
		</PostHogProvider>
	);
}

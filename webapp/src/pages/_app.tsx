import { useEffect } from 'react';
import Layout from '../components/Layout';
import 'nprogress/nprogress.css';
import NProgress from 'nprogress';
import Router from 'next/router';
import Head from 'next/head';
import './globals.css';
import { AccountWrapper } from '../context/account';
import { SocketWrapper } from '../context/socket';
import { ChatWrapper } from '../context/chat';
import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

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
// const loadRoutes = ['/login', '/register', '/changepassword', '/'];
// Router.events.on('routeChangeStart', (url) => loadRoutes.includes(url) &&NProgress.start());
// Router.events.on('routeChangeComplete', (url) => loadRoutes.includes(url) && NProgress.done());
Router.events.on('routeChangeStart', (url) => NProgress.start());
Router.events.on('routeChangeComplete', (url) => NProgress.done());
Router.events.on('routeChangeError', (_url) => NProgress.done());

export default function App({ Component, pageProps }) {

	useEffect(() => {
		if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
			// Track page views
			const handleRouteChange = () => posthog?.capture('$pageview');
			Router.events.on('routeChangeComplete', handleRouteChange);
			return () => {
				Router.events.off('routeChangeComplete', handleRouteChange);
			};
		}
	}, []);

	console.log('process.env.NEXT_PUBLIC_POSTHOG_KEY', process.env.NEXT_PUBLIC_POSTHOG_KEY);

	const [pagePropsState] = useState(pageProps);
	return (
		<PostHogProvider client={posthog}>
			<AccountWrapper pageProps={pagePropsState}>
				<ChatWrapper>
					<SocketWrapper>
						<ToastContainer
							progressClassName='toast-container'
							bodyClassName='toast-body'
							theme='colored'
							position='top-right'
							autoClose={4000}
							newestOnTop={true}
							pauseOnFocusLoss={false}
							pauseOnHover={false}
							hideProgressBar={true}
						/>
						<Layout {...pagePropsState}>
							<style>
								{''}
							</style>
							<Component {...pagePropsState} />
						</Layout>
					</SocketWrapper>
				</ChatWrapper>
			</AccountWrapper>
		</PostHogProvider>
	);
}

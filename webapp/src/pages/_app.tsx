import Layout from '../components/Layout';
import 'nprogress/nprogress.css';
import NProgress from 'nprogress';
import Router from 'next/router';
import './globals.css';
import { AccountWrapper } from '../context/account';
import { SocketWrapper } from '../context/socket';
import React, { useState } from 'react';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
  
NProgress.configure({ showSpinner: false });
// const loadRoutes = ['/login', '/register', '/changepassword', '/'];
// Router.events.on('routeChangeStart', (url) => loadRoutes.includes(url) &&NProgress.start());
// Router.events.on('routeChangeComplete', (url) => loadRoutes.includes(url) && NProgress.done());
Router.events.on('routeChangeStart', (url) => NProgress.start());
Router.events.on('routeChangeComplete', (url) => NProgress.done());
Router.events.on('routeChangeError', (_url) => NProgress.done());

export default function App({ Component, pageProps }) {
	const [pagePropsState] = useState(pageProps);
	return (
		<AccountWrapper pageProps={pagePropsState}>
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
		</AccountWrapper>
	);
}

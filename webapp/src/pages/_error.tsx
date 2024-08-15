import { NextPageContext } from 'next';
import Error from 'next/error';
import { usePostHog } from 'posthog-js/react';

interface ErrorProps {
	statusCode: number;
	error?: Error;
}

function Page({ statusCode, error }: ErrorProps) {
	const posthog = usePostHog();
	posthog.capture('errorPage', {
		error: error?.toString()
	});
	console.error('errorPage', {
		error
	});
	return <Error statusCode={statusCode} />;
}

Page.getInitialProps = ({ res, err }: NextPageContext) => {
	const statusCode = res ? res.statusCode : err ? err.statusCode : 404;
	return { statusCode, error: err };
};

export default Page;

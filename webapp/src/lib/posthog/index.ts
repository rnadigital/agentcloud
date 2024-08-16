import { PostHog } from 'posthog-node';

const client = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
	host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://us.i.posthog.com'
});

export default client;

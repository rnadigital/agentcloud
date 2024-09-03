import * as API from '@api';
import { useChatContext } from 'context/chat';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { toast } from 'react-toastify';

export default function ChatRestartMessage() {
	const [chatContext]: any = useChatContext();
	const router = useRouter();
	const posthog = usePostHog();
	const resourceSlug = router?.query?.resourceSlug || chatContext?.account?.currentTeam;

	const restartSession = () => {
		posthog.capture('restartSession', {
			appId: chatContext?.app._id,
			appType: chatContext?.app.type,
			appName: chatContext?.app.name
		});
		API.addSession(
			{
				_csrf: chatContext?.csrf,
				resourceSlug,
				id: chatContext?.app?._id
			},
			null,
			toast.error,
			router
		);
	};

	return (
		<div>
			<span>
				⛔ Conversation max limit reached, click{' '}
				<button onClick={restartSession} className='text-blue-500 dark:text-blue-300'>
					here
				</button>{' '}
				to restart the chat{' '}
			</span>
		</div>
	);
}

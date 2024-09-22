import * as API from '@api';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Task } from 'struct/task';

const useActiveTask = (messages: any[]) => {
	const [activeTask, setActiveTask] = useState<Task>();
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const lastRunningTaskName = messages.findLast(
		m =>
			typeof m.message?.text === 'string' &&
			m?.message?.displayType === 'inline' && //optimization: task running messages are always an inline
			m.message?.text?.startsWith('**Running task**:')
	);
	const { resourceSlug, sessionId } = router.query;

	useEffect(() => {
		if (lastRunningTaskName) {
			const taskNameMatch = lastRunningTaskName.message.text.match(
				/\*\*Running task\*\*:\s(.+?)\s\*\*/
			);
			const taskName = taskNameMatch ? taskNameMatch[1].trim() : null;

			API.getTask(
				{
					resourceSlug,
					sessionId,
					name: taskName,
					_csrf: csrf
				},
				setActiveTask,
				null,
				null
			);
		} else {
			setActiveTask(null);
		}
	}, [lastRunningTaskName, resourceSlug, sessionId]);

	return activeTask;
};

export default useActiveTask;

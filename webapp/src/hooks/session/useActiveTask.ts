import * as API from '@api';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { Task } from 'struct/task';

const useActiveTask = (messages: any[]) => {
	const [activeTask, setActiveTask] = useState<Task>();
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const lastRunningTaskName = messages.findLast(m =>
		m.message?.text?.startsWith('**Running task**:')
	);
	const router = useRouter();

	const { resourceSlug } = router.query;

	useEffect(() => {
		if (lastRunningTaskName) {
			const taskNameMatch = lastRunningTaskName.message.text.match(
				/\*\*Running task\*\*:\s(.+?)\s\*\*/
			);
			const taskName = taskNameMatch ? taskNameMatch[1].trim() : null;

			API.getTaskByName(
				{
					resourceSlug,
					taskName,
					_csrf: csrf
				},
				setActiveTask,
				null,
				null
			);
		}
	}, [lastRunningTaskName]);

	return activeTask;
};

export default useActiveTask;

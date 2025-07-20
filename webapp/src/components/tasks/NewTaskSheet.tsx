import * as API from '@api';
import Spinner from 'components/Spinner';
import TaskForm from 'components/TaskForm';
import { useAccountContext } from 'context/account';
import { BookText } from 'lucide-react';
import { Separator } from 'modules/components/ui/separator';
import { Sheet, SheetContent, SheetTitle, SheetTrigger } from 'modules/components/ui/sheet';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

export default function NewTaskSheet({
	open,
	callback,
	setOpen
}: {
	open: boolean;
	callback?: (addedTaskId: string, body: any) => void;
	setOpen: (open: boolean) => void;
}) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState<any>();
	const [cloneState, setCloneState] = useState(null);
	const [error, setError] = useState();
	const [loading, setLoading] = useState(true);
	const { tasks, tools, agents, variables } = state || {};

	async function fetchTaskFormData() {
		await API.getTasks({ resourceSlug }, dispatch, setError, router);
	}

	async function fetchEditData(taskId) {
		await API.getTaskById({ resourceSlug, taskId }, setCloneState, setError, router);
	}

	useEffect(() => {
		fetchTaskFormData();
	}, [resourceSlug]);

	useEffect(() => {
		if (typeof location != undefined) {
			const taskId = new URLSearchParams(location.search).get('taskId');
			if (taskId) {
				fetchEditData(taskId);
			} else {
				setLoading(false);
			}
		}
	}, []);

	useEffect(() => {
		if (cloneState != null) {
			setLoading(false);
		}
	}, [cloneState]);

	if (loading) {
		return <Spinner />;
	}

	return (
		<Sheet open={open} onOpenChange={setOpen}>
			<SheetContent className='text-foreground sm:max-w-[576px] overflow-auto'>
				<SheetTitle>
					<div className='flex items-center gap-2'>
						<BookText width={15} />
						<p className='font-medium text-gray-900 text-sm'>New Task</p>
					</div>
				</SheetTitle>
				<Separator className='my-4' />
				<TaskForm
					tools={tools}
					agents={agents}
					fetchTaskFormData={fetchTaskFormData}
					task={cloneState?.task}
					taskChoices={tasks}
					editing={false}
					variables={variables}
					compact
					callback={callback}
				/>
			</SheetContent>
		</Sheet>
	);
}

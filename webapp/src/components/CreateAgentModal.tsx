import * as API from '@api';
import AgentForm from 'components/AgentForm';
import { useAccountContext } from 'context/account';
import { AgentsDataReturnType } from 'controllers/agent';
import { Dialog, DialogContent, DialogTitle } from 'modules/components/ui/dialog';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';

export default function CreateAgentModal({ open, setOpen, callback }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState<AgentsDataReturnType>();
	const [error, setError] = useState();
	const { models, tools, variables } = state || {};

	async function fetchAgentFormData() {
		await API.getAgents({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchAgentFormData();
	}, []);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className='overflow-y-auto max-h-[90vh]'>
				<DialogTitle>Create an agent</DialogTitle>
				<AgentForm
					models={models}
					tools={tools}
					compact={true}
					callback={callback}
					fetchAgentFormData={fetchAgentFormData}
					variables={variables}
				/>
			</DialogContent>
		</Dialog>
	);
}

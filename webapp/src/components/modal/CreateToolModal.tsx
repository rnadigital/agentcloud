import * as API from '@api';
import ToolForm from 'components/tools/ToolForm';
import { useAccountContext } from 'context/account';
import { Dialog, DialogContent, DialogTitle } from 'modules/components/ui/dialog';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import { ToolType } from 'struct/tool';

export default function CreateToolModal({ open, setOpen, callback, initialType = null }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState({});
	const [error, setError] = useState();
	const { datasources } = state as any;

	async function fetchToolFormData() {
		await API.getTools({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchToolFormData();
	}, []);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent className='h-[90vh]'>
				<DialogTitle className='text-lg font-medium leading-6 text-gray-900 dark:text-white'>
					New Tool
				</DialogTitle>
				<div className='mt-2 overflow-auto'>
					<ToolForm
						compact={true}
						callback={callback}
						datasources={datasources}
						initialType={ToolType.FUNCTION_TOOL}
						fetchFormData={fetchToolFormData}
						setDisplayScreen={() => {}}
						fetchTools={() => {}}
						setActiveTab={() => {}}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

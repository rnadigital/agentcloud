import * as API from '@api';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';

import VariableForm from './VariableForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'modules/components/ui/dialog';

interface CreateVariableModalProps {
	open: boolean;
	setOpen: React.Dispatch<React.SetStateAction<any>>;
	callback?: Function;
}

export default function CreateVariableModal({ open, setOpen, callback }: CreateVariableModalProps) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState({});
	const [error, setError] = useState();
	console.log(callback);

	async function fetchVariableFormData() {
		await API.getVariables({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchVariableFormData();
	}, []);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle>Create a Variable</DialogTitle>
				</DialogHeader>
				<VariableForm callback={callback} fetchVariableFormData={fetchVariableFormData} />
			</DialogContent>
		</Dialog>
	);
}

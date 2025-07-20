import * as API from '@api';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';

import VectorDbForm from './VectorDbForm';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'modules/components/ui/dialog';
import { Separator } from 'modules/components/ui/separator';

export default function CreateVectorDbModal({ open, setOpen, callback }) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState({});
	const [error, setError] = useState();

	async function fetchVectorDBFormData() {
		await API.getVectorDbs({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchVectorDBFormData();
	}, []);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='text-2xl'>New Vector DB</DialogTitle>
					<Separator />
				</DialogHeader>
				<VectorDbForm
					// compact={true}
					callback={callback}
					fetchVectorDbFormData={fetchVectorDBFormData}
				/>
			</DialogContent>
		</Dialog>
	);
}

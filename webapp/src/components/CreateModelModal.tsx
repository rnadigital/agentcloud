import * as API from '@api';
import ModelForm from 'components/ModelForm';
import { useAccountContext } from 'context/account';
import { Separator } from 'modules/components/ui/separator';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from 'modules/components/ui/dialog';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';

export default function CreateModelModal({
	open,
	setOpen,
	callback,
	modelFilter = null,
	modelTypeFilters = []
}) {
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState({});
	const [error, setError] = useState();
	// const {  } = state as any; //TODO: secrets here

	async function fetchModelFormData() {
		await API.getModels({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchModelFormData();
	}, []);

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogHeader>
					<DialogTitle className='text-2xl'>New Model</DialogTitle>
					<Separator />
				</DialogHeader>
				<ModelForm callback={callback} fetchModelFormData={fetchModelFormData} />
			</DialogContent>
		</Dialog>
	);
}

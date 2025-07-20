import * as API from '@api';
import CreateDatasourceForm from 'components/CreateDatasourceForm'; // Assuming this component is similar to ModelForm but for datasources
import { useAccountContext } from 'context/account';
import FormContext from 'context/connectorform';
import { Dialog, DialogContent, DialogTitle } from 'modules/components/ui/dialog';
import { useRouter } from 'next/router';
import { Fragment, useEffect, useState } from 'react';
import { toast } from 'react-toastify';

export default function CreateDatasourceModal({ open, setOpen, callback, initialStep }) {
	const [accountContext]: any = useAccountContext();
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState({});
	const [vectorDbState, setVectorDbState] = useState(null);
	const { models } = state as any;
	const vectorDbs = vectorDbState?.vectorDbs || [];
	const [forceClose, setForceClose] = useState(false);
	const [spec, setSpec] = useState(null);

	async function fetchDatasourceFormData() {
		await API.getModels({ resourceSlug }, dispatch, toast.error, router);
		await API.getVectorDbs({ resourceSlug }, setVectorDbState, toast.error, router);
	}

	useEffect(() => {
		fetchDatasourceFormData();
	}, []);

	// const handleOnClose = () => {
	// 	if (!spec) {
	// 		setOpen(false);
	// 	} else {
	// 		setForceClose(!forceClose);
	// 	}
	// };

	// const closeConfirmModal = () => {
	// 	setForceClose(false);
	// };

	// const onConfirmClose = () => {
	// 	setOpen(!open);
	// 	setForceClose(false);
	// 	setSpec(null);
	// };

	return (
		<Dialog open={open} onOpenChange={setOpen}>
			<DialogContent>
				<DialogTitle className='text-lg font-medium text-gray-900 dark:text-white'>
					Create a Datasource
				</DialogTitle>
				<div className='pt-4'>
					<CreateDatasourceForm
						compact={true}
						callback={callback}
						models={models}
						spec={spec}
						setSpec={setSpec}
						fetchDatasourceFormData={fetchDatasourceFormData}
						initialStep={initialStep}
						vectorDbs={vectorDbs}
					/>
				</div>
			</DialogContent>
		</Dialog>
	);
}

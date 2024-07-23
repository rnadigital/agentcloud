import * as API from '@api';
import ModelForm from 'components/ModelForm';
import { useAccountContext } from 'context/account';
import router, { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';

import Modal from './Modal';

export interface ModelConfig {
	name: string;
	type: string;
	config: Record<string, string>;
}

interface CloneModelModalProps {
	close: () => void;
	modelConfig: ModelConfig;
}

const CloneModelModal = ({ close, modelConfig: { name, type, config } }: CloneModelModalProps) => {
	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [state, dispatch] = useState();
	const [error, setError] = useState();

	function fetchModels() {
		API.getModels({ resourceSlug }, dispatch, setError, router);
	}

	useEffect(() => {
		fetchModels();
	}, [resourceSlug]);

	return (
		<Modal isOpen close={close}>
			<ModelForm fetchModelFormData={fetchModels} _model={{ name, type, config }} />
		</Modal>
	);
};

export default CloneModelModal;

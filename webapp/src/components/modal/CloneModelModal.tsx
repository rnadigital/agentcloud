import ModelForm from 'components/ModelForm';

import Modal from './Modal';

export interface ModelConfig {
	name: string;
	type: string;
	config: Record<string, string>;
}

interface CloneModelModalProps {
	close: () => void;
	modelConfig: ModelConfig;
	fetchModels: () => void;
}

const CloneModelModal = ({
	close,
	modelConfig: { name, type, config },
	fetchModels
}: CloneModelModalProps) => {
	const handleClone = async () => {
		await fetchModels();
		close();
	};

	return (
		<Modal isOpen close={close}>
			<ModelForm _model={{ name, type, config }} callback={handleClone} />
		</Modal>
	);
};

export default CloneModelModal;

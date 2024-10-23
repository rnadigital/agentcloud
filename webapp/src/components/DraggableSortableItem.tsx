import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { TasksDataReturnType } from 'controllers/task';
import React, { CSSProperties } from 'react';
import { FormFieldConfig } from 'struct/task';
import { Variable } from 'struct/variable';

import SortableItem from './SortableItem';

interface DraggableSortableItemProps {
	id: string;
	config?: Partial<FormFieldConfig>;
	style?: CSSProperties;
	editItem: (id: string, newConfig: FormFieldConfig) => void;
	deleteItem: (id: string) => void;
	variables: TasksDataReturnType['variables'];
	fetchTaskFormData?: Function;
}

const DraggableSortableItem: React.FC<DraggableSortableItemProps> = ({
	id,
	config,
	style,
	editItem,
	deleteItem,
	variables,
	fetchTaskFormData
}) => {
	const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id });
	const combinedStyle = {
		...style,
		transform: CSS.Transform.toString(transform),
		transition
	};

	return (
		<SortableItem
			ref={setNodeRef}
			id={id}
			config={config}
			style={combinedStyle}
			{...attributes}
			{...listeners}
			editItem={editItem}
			deleteItem={deleteItem}
			variables={variables}
			fetchTaskFormData={fetchTaskFormData}
		/>
	);
};

export default DraggableSortableItem;

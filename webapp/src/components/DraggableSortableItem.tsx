import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import React, { CSSProperties } from 'react';
import { FormFieldConfig } from 'struct/task';

import SortableItem from './SortableItem';

interface DraggableSortableItemProps {
	id: string;
	config?: FormFieldConfig;
	style?: CSSProperties;
	editItem: (id: string, newConfig: FormFieldConfig) => void;
	deleteItem: (id: string) => void;
}

const DraggableSortableItem: React.FC<DraggableSortableItemProps> = ({
	id,
	config,
	style,
	editItem,
	deleteItem
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
		/>
	);
};

export default DraggableSortableItem;

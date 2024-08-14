import {
	closestCenter,
	DndContext,
	DragOverlay,
	KeyboardSensor,
	PointerSensor,
	useSensor,
	useSensors
} from '@dnd-kit/core';
import { restrictToVerticalAxis } from '@dnd-kit/modifiers';
import {
	arrayMove,
	SortableContext,
	sortableKeyboardCoordinates,
	verticalListSortingStrategy
} from '@dnd-kit/sortable';
import React, { useState } from 'react';
import { FormFieldConfig } from 'struct/task';

import DraggableSortableItem from './DraggableSortableItem';
import SortableItem from './SortableItem';

const FormConfig: React.FC = () => {
	const [items, setItems] = useState<{ id: string; config: FormFieldConfig }[]>([
		{ id: '1', config: { type: 'string', name: 'Field 1', label: 'Label 1' } },
		{ id: '2', config: { type: 'number', name: 'Field 2', label: 'Label 2' } },
		{ id: '3', config: { type: 'checkbox', name: 'Field 3', label: 'Label 3' } }
	]);
	const [activeId, setActiveId] = useState<string | null>(null);

	const sensors = useSensors(
		useSensor(PointerSensor),
		useSensor(KeyboardSensor, {
			coordinateGetter: sortableKeyboardCoordinates
		})
	);

	const handleDragStart = (event: any) => {
		setActiveId(event.active.id);
	};

	const handleDragEnd = (event: any) => {
		const { active, over } = event;
		if (active.id !== over.id) {
			setItems(items => {
				const oldIndex = items.findIndex(item => item.id === active.id);
				const newIndex = items.findIndex(item => item.id === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
		setActiveId(null);
	};

	const editItem = (id: string, newConfig: FormFieldConfig) => {
		setItems(items => items.map(item => (item.id === id ? { ...item, config: newConfig } : item)));
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
			modifiers={[restrictToVerticalAxis]}
			onDragStart={handleDragStart}
		>
			<SortableContext items={items.map(item => item.id)} strategy={verticalListSortingStrategy}>
				{items.map(({ id, config }) => (
					<DraggableSortableItem
						key={id}
						id={id}
						config={config}
						style={{ visibility: id === activeId ? 'hidden' : 'visible' }}
						editItem={editItem}
					/>
				))}
			</SortableContext>
			<DragOverlay>
				{activeId ? (
					<SortableItem
						id={activeId}
						config={items.find(item => item.id === activeId)?.config}
						editItem={editItem}
					/>
				) : null}
			</DragOverlay>
		</DndContext>
	);
};

export default FormConfig;

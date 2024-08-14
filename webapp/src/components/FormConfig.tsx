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
	const [items, setItems] = useState<{ id: string; config: FormFieldConfig }[]>([]);
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

	const addItem = () => {
		const newItem = {
			id: (items.length + 1).toString(),
			config: {
				type: 'string' as 'string',
				name: `Field ${items.length + 1}`,
				label: `Label ${items.length + 1}`
			}
		};
		setItems([...items, newItem]);
	};

	const deleteItem = (id: string) => {
		setItems(items => items.filter(item => item.id !== id));
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
						deleteItem={deleteItem}
					/>
				))}
			</SortableContext>
			<DragOverlay>
				{activeId ? (
					<SortableItem
						id={activeId}
						config={items.find(item => item.id === activeId)?.config}
						editItem={editItem}
						deleteItem={deleteItem}
					/>
				) : null}
			</DragOverlay>

			<button
				type='button'
				onClick={addItem}
				className='mt-2 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowed'
			>
				Add Field
			</button>
		</DndContext>
	);
};

export default FormConfig;

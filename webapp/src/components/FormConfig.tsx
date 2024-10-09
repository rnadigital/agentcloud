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
import { PlusIcon } from '@heroicons/react/24/outline';
import { TasksDataReturnType } from 'controllers/task';
import React, { useState } from 'react';
import { FormFieldConfig } from 'struct/task';

import DraggableSortableItem from './DraggableSortableItem';
import SortableItem from './SortableItem';

interface FormConfigProps {
	formFields: Partial<FormFieldConfig>[];
	setFormFields: Function;
	variables: TasksDataReturnType['variables'];
	fetchTaskFormData?: Function;
}

const FormConfig = ({
	formFields,
	setFormFields,
	variables,
	fetchTaskFormData
}: FormConfigProps) => {
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
			setFormFields(items => {
				const oldIndex = items.findIndex(item => item.position === active.id);
				const newIndex = items.findIndex(item => item.position === over.id);
				return arrayMove(items, oldIndex, newIndex);
			});
		}
		setActiveId(null);
	};

	const editItem = (id: string, newConfig: FormFieldConfig) => {
		setFormFields(items =>
			formFields.map(item => (item.position === id ? { ...item, ...newConfig } : item))
		);
	};

	const addItem = () => {
		const newItem: Partial<FormFieldConfig> = {
			position: (formFields.length + 1).toString(),
			type: 'string'
		};
		setFormFields([...formFields, newItem]);
	};

	const deleteItem = (id: string) => {
		setFormFields(items => items.filter(item => item.position !== id));
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
			modifiers={[restrictToVerticalAxis]}
			onDragStart={handleDragStart}
		>
			<SortableContext
				items={formFields.map(item => item.position)}
				strategy={verticalListSortingStrategy}
			>
				<div className='flex flex-col gap-2'>
					{formFields.map(config => (
						<DraggableSortableItem
							key={config.position}
							id={config.position}
							config={config}
							style={{ visibility: config.position === activeId ? 'hidden' : 'visible' }}
							editItem={editItem}
							deleteItem={deleteItem}
							variables={variables}
							fetchTaskFormData={fetchTaskFormData}
						/>
					))}
				</div>
			</SortableContext>
			<DragOverlay>
				{activeId ? (
					<SortableItem
						id={activeId}
						config={formFields.find(item => item.position === activeId)}
						editItem={editItem}
						deleteItem={deleteItem}
					/>
				) : null}
			</DragOverlay>

			<button
				type='button'
				onClick={addItem}
				className='mt-2 inline-flex items-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 disabled:bg-gray-300 disabled:text-gray-700 disabled:cursor-not-allowe '
			>
				<PlusIcon className='h-4 w-4 text-gray-400 dark:text-white mr-2' />
				<span>Add Field</span>
			</button>
		</DndContext>
	);
};

export default FormConfig;

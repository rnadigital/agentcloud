import { PlusIcon } from 'lucide-react';
import { Button } from 'modules/components/ui/button';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger
} from 'modules/components/ui/dropdown-menu';
import { useState, useRef, useEffect } from 'react';
import { Task } from 'struct/task';

export default function TaskFlow({
	taskChoices,
	setModalOpen
}: {
	taskChoices: Task[];
	setModalOpen: (modal: string) => void;
}) {
	const [tasks, setTasks] = useState([]);
	const [availableTasks, setAvailableTasks] = useState(taskChoices.map(task => task.name));
	const [rows, setRows] = useState([]);
	const [createTaskFits, setCreateTaskFits] = useState(false);
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [newTaskName, setNewTaskName] = useState('');

	const containerRef = useRef(null);

	useEffect(() => {
		updateRows();
	}, [tasks]);

	const updateRows = () => {
		const container = containerRef.current;
		if (!container) return;

		const maxWidth = container.offsetWidth;
		const startWidth = 80;
		const lineWidth = 30;
		const comboBoxWidth = 180;
		const rowHeight = 80;

		let allRows = [];
		let currentRow = [];
		let currentRowWidth = 0;
		let taskCounter = 1;

		currentRow.push({ type: 'start', width: startWidth });
		currentRowWidth = startWidth;

		tasks.forEach(task => {
			const tempSpan = document.createElement('span');
			tempSpan.style.visibility = 'hidden';
			tempSpan.style.position = 'absolute';
			tempSpan.style.fontSize = '14px';
			tempSpan.style.padding = '8px 16px';
			tempSpan.innerText = task;
			document.body.appendChild(tempSpan);

			const taskWidth = tempSpan.offsetWidth + 40;
			document.body.removeChild(tempSpan);

			const newElementWidth = taskWidth + lineWidth;
			const totalWidthNeeded = currentRowWidth + lineWidth + newElementWidth;

			if (totalWidthNeeded > maxWidth) {
				const remainingWidth = maxWidth - currentRowWidth;
				if (remainingWidth > 0) {
					currentRow.push({ type: 'line', width: remainingWidth });
				}
				allRows.push([...currentRow]);
				currentRow = [{ type: 'line', width: lineWidth }];
				currentRowWidth = lineWidth;
			}

			if (currentRowWidth > 0) {
				currentRow.push({ type: 'line', width: lineWidth });
				currentRowWidth += lineWidth;
			}

			currentRow.push({
				type: 'task',
				width: taskWidth,
				height: rowHeight,
				task,
				number: taskCounter++
			});
			currentRowWidth += taskWidth;
		});

		const comboBoxTotalWidth = lineWidth + comboBoxWidth;
		const comboBoxFits = currentRowWidth + comboBoxTotalWidth <= maxWidth;

		if (comboBoxFits) {
			currentRow.push({ type: 'line', width: lineWidth });
			currentRow.push({ type: 'comboBox', width: comboBoxWidth, height: rowHeight });
			setCreateTaskFits(true);
		} else {
			// Add fill line before creating new row
			const remainingWidth = maxWidth - currentRowWidth;
			if (remainingWidth > 0) {
				currentRow.push({ type: 'line', width: remainingWidth });
			}
			allRows.push([...currentRow]);
			currentRow = [
				{ type: 'line', width: lineWidth },
				{ type: 'comboBox', width: comboBoxWidth, height: rowHeight }
			];
			setCreateTaskFits(false);
		}

		allRows.push(currentRow);
		setRows(allRows);
	};

	const handleAddTask = task => {
		setTasks([...tasks, task]);
		setAvailableTasks(availableTasks.filter(t => t !== task));
	};

	const handleCreateNewTask = () => {
		setModalOpen('task');
	};

	const handleSaveNewTask = () => {
		if (newTaskName.trim()) {
			setTasks([...tasks, newTaskName.trim()]);
			setNewTaskName('');
			setIsModalOpen(false);
		}
	};

	return (
		<div className='w-full mx-auto  bg-gray-50'>
			<div ref={containerRef} className='space-y-2'>
				{rows.map((row, rowIndex) => (
					<div
						key={rowIndex}
						className='flex items-center'
						style={{ height: '80px', alignItems: 'center' }}>
						{row.map((item, itemIndex) =>
							item.type === 'start' ? (
								<div
									key={itemIndex}
									className='ml-4 flex items-center justify-center w-20 h-12 bg-blue-500 text-white rounded-full text-sm'>
									Start
								</div>
							) : item.type === 'line' ? (
								<div
									key={itemIndex}
									className='h-0 border-t-2 border-dashed'
									style={{ width: `${item.width}px` }}></div>
							) : item.type === 'fill' ? (
								rowIndex < rows.length - 1 || !createTaskFits ? (
									// Only add filler lines for non-last rows or when combo box doesn't fit
									<div
										key={itemIndex}
										className='border-t-2 border-dashed'
										style={{ flexGrow: 1, width: `${item.width}px` }}></div>
								) : null
							) : item.type === 'comboBox' ? (
								<DropdownMenu>
									<DropdownMenuTrigger>
										<Button variant='outline' className='w-[180px]'>
											<PlusIcon className='w-4 h-4' />
											<p>Add a Task</p>
										</Button>
									</DropdownMenuTrigger>

									<DropdownMenuContent className='w-[--radix-dropdown-menu-trigger-width]'>
										{availableTasks.map(task => (
											<DropdownMenuItem key={task} onClick={() => handleAddTask(task)}>
												{task}
											</DropdownMenuItem>
										))}
										<DropdownMenuItem onClick={handleCreateNewTask}>
											Create New Task
										</DropdownMenuItem>
									</DropdownMenuContent>
								</DropdownMenu>
							) : (
								// <div key={itemIndex} className='relative'>
								// 	<select
								// 		className='px-4 py-2 border rounded-md bg-white w-[180px] h-[50px]'
								// 		onChange={e => {
								// 			if (e.target.value === 'create') {
								// 				handleCreateNewTask();
								// 			} else if (e.target.value) {
								// 				handleAddTask(e.target.value);
								// 			}
								// 			e.target.value = ''; // Reset dropdown
								// 		}}>
								// 		<option value=''>+ Add Task</option>
								// 		{availableTasks.map((task, index) => (
								// 			<option key={index} value={task}>
								// 				{task}
								// 			</option>
								// 		))}
								// 		<option value='create'>Create New Task</option>
								// 	</select>
								// </div>
								<div
									key={itemIndex}
									className='flex items-center space-x-2 px-4 py-2 border rounded-md bg-gray-100 shadow h-[50px] relative border-gray-200'
									style={{
										display: 'flex',
										alignItems: 'center',
										width: `${item.width}px`
									}}>
									<span className='text-xs absolute -left-3 rounded-full bg-white px-2 py-1 botder border-gray-200'>
										{item.number}
									</span>
									<span className='text-sm font-medium line-clamp-1 text-gray-900'>
										{item.task}
									</span>
								</div>
							)
						)}
					</div>
				))}
			</div>

			{isModalOpen && (
				<div className='fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-10'>
					<div className='bg-white p-6 rounded-md w-full max-w-sm'>
						<h2 className='text-lg font-bold mb-4'>Create New Task</h2>
						<input
							type='text'
							className='w-full border p-2 rounded-md mb-4'
							placeholder='Enter task name'
							value={newTaskName}
							onChange={e => setNewTaskName(e.target.value)}
						/>
						<div className='flex justify-end space-x-2'>
							<button
								onClick={() => setIsModalOpen(false)}
								className='px-4 py-2 bg-gray-300 rounded-md'>
								Cancel
							</button>
							<button
								onClick={handleSaveNewTask}
								className='px-4 py-2 bg-blue-500 text-white rounded-md'>
								Add
							</button>
						</div>
					</div>
				</div>
			)}
		</div>
	);
}

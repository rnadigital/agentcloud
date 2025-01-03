import { useState, useRef, useEffect } from 'react';

export default function TaskFlow() {
	const initialTasks = [
		'Data Collection',
		'Data Cleaning',
		'Data Analysis',
		'Predictive Modeling',
		'Model Evaluation',
		'Report Generation',
		'Automation of Workflow',
		'Deployment'
	];

	const [tasks, setTasks] = useState([]);
	const [availableTasks, setAvailableTasks] = useState(initialTasks);
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

		// First row starts with Start element
		currentRow.push({ type: 'start', width: startWidth });
		currentRowWidth = startWidth;

		tasks.forEach(task => {
			// Create temporary element to measure text width
			const tempSpan = document.createElement('span');
			tempSpan.style.visibility = 'hidden';
			tempSpan.style.position = 'absolute';
			tempSpan.style.fontSize = '14px'; // Match your task text size
			tempSpan.style.padding = '8px 16px'; // Match your task padding
			tempSpan.innerText = task;
			document.body.appendChild(tempSpan);

			// Get width and add some padding for the task container
			const taskWidth = tempSpan.offsetWidth + 40; // Add padding for container
			document.body.removeChild(tempSpan);

			// Calculate width needed for new task (task + connecting line)
			const newElementWidth = taskWidth + lineWidth;
			const totalWidthNeeded = currentRowWidth + lineWidth + newElementWidth;

			// Check if new task fits in current row
			if (totalWidthNeeded > maxWidth) {
				allRows.push([...currentRow]);
				currentRow = [{ type: 'line', width: lineWidth }];
				currentRowWidth = lineWidth;
			}

			// Add connecting line if row is not empty
			if (currentRowWidth > 0) {
				currentRow.push({ type: 'line', width: lineWidth });
				currentRowWidth += lineWidth;
			}

			// Add task
			currentRow.push({
				type: 'task',
				width: taskWidth,
				height: rowHeight,
				task,
				number: taskCounter++
			});
			currentRowWidth += taskWidth;
		});

		// Check if combo box fits in current row
		const comboBoxTotalWidth = lineWidth + comboBoxWidth;
		const comboBoxFits = currentRowWidth + comboBoxTotalWidth <= maxWidth;

		if (comboBoxFits) {
			currentRow.push({ type: 'line', width: lineWidth });
			currentRow.push({ type: 'comboBox', width: comboBoxWidth, height: rowHeight });
			setCreateTaskFits(true);
		} else {
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
		setIsModalOpen(true);
	};

	const handleSaveNewTask = () => {
		if (newTaskName.trim()) {
			setTasks([...tasks, newTaskName.trim()]);
			setNewTaskName('');
			setIsModalOpen(false);
		}
	};

	return (
		<div className='w-full max-w-4xl mx-auto mt-8 p-4 border rounded-md bg-gray-50'>
			{/* Tasks Container */}
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
									className='flex items-center justify-center w-20 h-12 bg-blue-500 text-white rounded-full text-sm'>
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
								<div key={itemIndex} className='relative'>
									<select
										className='px-4 py-2 border rounded-md bg-white w-[180px] h-[50px]'
										onChange={e => {
											if (e.target.value === 'create') {
												handleCreateNewTask();
											} else if (e.target.value) {
												handleAddTask(e.target.value);
											}
											e.target.value = ''; // Reset dropdown
										}}>
										<option value=''>+ Add Task</option>
										{availableTasks.map((task, index) => (
											<option key={index} value={task}>
												{task}
											</option>
										))}
										<option value='create'>Create New Task</option>
									</select>
								</div>
							) : (
								<div
									key={itemIndex}
									className='flex items-center space-x-2 px-4 py-2 border rounded-md bg-gray-200 shadow h-[50px] relative'
									style={{
										display: 'flex',
										alignItems: 'center',
										width: `${item.width}px`
									}}>
									<span className='text-xs absolute -left-3 rounded-full bg-white px-2 py-1'>
										{item.number}
									</span>
									<span className='text-sm font-medium line-clamp-1'>{item.task}</span>
								</div>
							)
						)}
					</div>
				))}
			</div>

			{/* Modal for New Task */}
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

import React, { useState } from 'react';
import { Trash, Trash2 } from 'lucide-react';
import { Input } from 'modules/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';
import { Label } from 'modules/components/ui/label';

export function StepperEditConfig() {
	const [editingParameterId, setEditingParameterId] = useState<number | null>(null);
	const [parameters, setParameters] = useState([
		{
			id: 1,
			text: 'Parameter 1',
			description: '',
			type: '',
			required: false
		}
	]);

	const handleParameterEdit = (id: number, newText: string) => {
		setParameters(
			parameters.map(starter => (starter.id === id ? { ...starter, text: newText } : starter))
		);
	};

	const handleParameterDelete = (id: number) => {
		setParameters(parameters.filter(starter => starter.id !== id));
	};

	const handleParameterAdd = () => {
		const newId = Math.max(0, ...parameters.map(s => s.id)) + 1;
		const newStarter = {
			id: newId,
			text: '',
			description: '',
			type: '',
			required: false
		};
		setParameters([...parameters, newStarter]);
		setEditingParameterId(newId);
	};
	return (
		<div className='flex flex-col gap-4 text-sm'>
			<div>
				<p className='font-semibold'>Config</p>
				<p>
					List all the Python packages your tool needs. This ensures all necessary libraries are
					installed for your code to run.
				</p>
			</div>
			<div className='flex flex-col gap-2'>
				<div className='flex flex-col gap-2 p-2 rounded-lg bg-gray-50'>
					<p className='font-semibold'>Parameters</p>
					{parameters.map(parameter => (
						<div className='flex items-center gap-2'>
							<div className='border border-gray-200 w-full'>
								<div className='flex'>
									<div
										className='w-full flex items-center'
										onClick={() => setEditingParameterId(parameter.id)}
									>
										{editingParameterId === parameter.id ? (
											<Input
												onChange={e => handleParameterEdit(parameter.id, e.target.value)}
												onBlur={() => {
													if (!parameter.text.trim()) {
														handleParameterDelete(parameter.id);
													}
													setEditingParameterId(null);
												}}
												onKeyDown={e => {
													if (e.key === 'Enter') {
														if (!parameter.text.trim()) {
															handleParameterDelete(parameter.id);
														}
														setEditingParameterId(null);
													}
												}}
												placeholder='Name'
												className='w-full ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 shadow-none border-0 border-b border-gray-200'
											/>
										) : (
											<p className='w-full flex items-center p-2 border-b border-gray-200'>
												{parameter.text}
											</p>
										)}
									</div>
									<div className='w-[300px]'>
										<Select
											value={parameter.type}
											onValueChange={e => handleParameterEdit(parameter.id, e)}
										>
											<SelectTrigger className='w-full rounded-none outline-none'>
												<SelectValue placeholder='Type' />
											</SelectTrigger>
											<SelectContent>
												<SelectItem value='type1'>Type 1</SelectItem>
											</SelectContent>
										</Select>
									</div>
									<div className='flex items-center gap-2 px-4 w-fit border-b border-gray-200'>
										<Label htmlFor='required'>Required</Label>
									</div>
								</div>
								<div>
									<Input
										value={parameter.description}
										onChange={e => handleParameterEdit(parameter.id, e.target.value)}
										placeholder='Description'
										className='w-full ring-0 focus-visible:ring-offset-0 focus-visible:ring-0 shadow-none border-0'
									/>
								</div>
							</div>
							<Trash2
								color='#9CA3AF'
								width={18}
								height={18}
								onClick={() => handleParameterDelete(parameter.id)}
							/>
						</div>
					))}
					<p
						className='text-[#4F46E5] cursor-pointer self-end hover:text-[#3730a3] font-medium'
						onClick={handleParameterAdd}
					>
						+ Add
					</p>
				</div>
			</div>
		</div>
	);
}

import { Input } from 'modules/components/ui/input';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue
} from 'modules/components/ui/select';
import { Textarea } from 'modules/components/ui/textarea';
import React from 'react';
import { useDataSourcesStore } from 'store/data-source';

export const New = () => {
	const { dataSources } = useDataSourcesStore();

	return (
		<div className='flex flex-col gap-4'>
			<div className='text-sm flex flex-col gap-2'>
				<p>Name</p>
				<Input placeholder='Tool name' className='p-5 bg-gray-50 border border-gray-300' />
			</div>
			<div className='text-sm flex flex-col gap-2'>
				<p>Description</p>
				<p className='text-gray-500'>
					A verbose and detailed description helps agents to better understand when to use this tool
				</p>
				<Textarea
					id='goal'
					className='resize-none h-20 bg-gray-50 border-gray-300'
					placeholder='Help potential customers understand product benefits and close sales.'
				/>
			</div>
			<div className='text-sm flex flex-col gap-2'>
				<p>Data Source</p>
				<Select>
					<SelectTrigger className='w-[180px] w-full lg:w-fit'>
						<SelectValue placeholder='Select data source' />
					</SelectTrigger>
					<SelectContent>
						{dataSources.map(dataSource => (
							<SelectItem key={dataSource.value} value={dataSource.value}>
								{dataSource.label}
							</SelectItem>
						))}
					</SelectContent>
				</Select>
			</div>
		</div>
	);
};

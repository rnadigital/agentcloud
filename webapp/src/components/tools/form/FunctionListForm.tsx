import FunctionCard from 'components/FunctionCard';
import React from 'react';

export default function FunctionListForm({
	functionsList,
	filteredFunctionsList,
	searchTerm,
	handleSearchChange,
	invalidFuns,
	setSelectedOpenAPIMatchKey,
	setToolName,
	setToolDescription,
	setParameters
}) {
	return (
		<div>
			<div className='mb-4'>
				<label className='text-base font-semibold text-gray-900'>Select an OpenAPI Endpoint:</label>
				<div className='pt-2'>
					<input
						type='text'
						placeholder='Search by name or description...'
						onChange={handleSearchChange}
						value={searchTerm}
						className='p-2 border rounded'
					/>
					{invalidFuns > 0 && (
						<span className='ml-4 rounded-md bg-yellow-100 px-2 py-1 text-sm font-medium text-yellow-800'>
							{invalidFuns} endpoint
							{invalidFuns > 1
								? 's are not shown because they are'
								: ' is not shown because it is'}{' '}
							missing a <code className='text-xs'>name</code> property in the API definition
						</span>
					)}
				</div>
			</div>
			<div className='grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4'>
				{filteredFunctionsList &&
					filteredFunctionsList.map((item, index) => (
						<FunctionCard
							key={`functionList_${index}`}
							{...item}
							onClickFunction={() => {
								setSelectedOpenAPIMatchKey(item?.openAPIMatchKey);
								setToolName(item?.name);
								setToolDescription(item?.description);
								const functionParameters =
									item?.parameters?.properties &&
									Object.entries(item.parameters.properties).reduce((acc, entry) => {
										const [parname, par]: any = entry;
										acc.push({
											name: parname,
											type: par.type,
											description: par.description,
											required: item.parameters.required.includes(parname)
										});
										return acc;
									}, []);
								setParameters(functionParameters || []);
							}}
						/>
					))}
			</div>
		</div>
	);
}

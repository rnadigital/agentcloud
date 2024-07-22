export default function formatDatasourceOptionLabel(data: any) {
	return (
		<li
			className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 ${
				data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
			}`}
		>
			<span>
				{data.sourceType && (
					<img
						src={`https://connectors.airbyte.com/files/metadata/airbyte/source-${data.sourceType}/latest/icon.svg`}
						loading='lazy'
						className='inline-flex me-2 w-6 h-6'
					/>
				)}
				{data.label}
			</span>
		</li>
	);
}

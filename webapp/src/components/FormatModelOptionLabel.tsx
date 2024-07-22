export default function formatModelOptionLabel(data) {
	return (
		<li
			className={`block transition duration-200 px-2 py-2 cursor-pointer select-none truncate rounded hover:bg-blue-100 hover:text-blue-500 	${
				data.isSelected ? 'bg-blue-100 text-blue-500' : 'dark:text-white'
			}`}
		>
			{data.label} {data?.model ? `(${data?.model})` : null}
		</li>
	);
}

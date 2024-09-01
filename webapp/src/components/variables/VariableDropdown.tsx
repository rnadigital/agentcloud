interface AutocompleteDropdownProps {
	options: { label: string; value: string }[];
	highlightedIndex: number;
	dropdownPosition: { top: number; left: number };
	handleOptionSelect: (option: { label: string; value: string }) => void;
}

const AutocompleteDropdown = ({
	options,
	highlightedIndex,
	dropdownPosition,
	handleOptionSelect
}: AutocompleteDropdownProps) => {
	return (
		<ul
			style={{
				position: 'absolute',
				top: dropdownPosition.top + 20,
				left: dropdownPosition.left,
				backgroundColor: 'white',
				border: '1px solid #ccc',
				listStyle: 'none',
				padding: '5px',
				margin: 0,
				cursor: 'pointer',
				zIndex: 10
			}}
		>
			{options.map((option, index) => (
				<li
					key={index}
					onClick={() => handleOptionSelect(option)}
					style={{
						padding: '5px',
						backgroundColor: highlightedIndex === index ? '#ddd' : 'white'
					}}
				>
					{option.label}
				</li>
			))}
		</ul>
	);
};

export default AutocompleteDropdown;

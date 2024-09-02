import cn from 'lib/cn';
import SelectClassNames from 'lib/styles/SelectClassNames';

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
			className={cn(
				'absolute list-none p-1 m-0 cursor-pointer z-10',
				SelectClassNames.menu,
				'w-fit'
			)}
			style={{
				top: dropdownPosition.top,
				left: dropdownPosition.left
			}}
		>
			{options.map((option, index) => (
				<li
					key={index}
					onClick={() => handleOptionSelect(option)}
					className={cn(SelectClassNames.listItem({ isSelected: highlightedIndex === index }))}
				>
					{option.label}
				</li>
			))}
		</ul>
	);
};

export default AutocompleteDropdown;

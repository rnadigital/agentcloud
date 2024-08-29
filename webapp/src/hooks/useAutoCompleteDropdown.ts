import { useEffect, useRef, useState } from 'react';

const useAutocompleteDropdown = options => {
	const [text, setText] = useState('');
	const [showDropdown, setShowDropdown] = useState(false);
	const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });
	const [filterText, setFilterText] = useState('');
	const [highlightedIndex, setHighlightedIndex] = useState(0);
	const inputRef = useRef(null);

	const filteredOptions = options.filter(option =>
		option.toLowerCase().startsWith(filterText.toLowerCase())
	);

	useEffect(() => {
		if (showDropdown && highlightedIndex >= filteredOptions.length) {
			setHighlightedIndex(0);
		}
	}, [filteredOptions.length, highlightedIndex, showDropdown]);

	const handleChange = e => {
		const input = inputRef.current;
		const cursorPosition = input.selectionStart;
		const newText = e.target.value;
		setText(newText);

		const textUpToCursor = newText.slice(0, cursorPosition);
		const lastDoubleOpenBraceIndex = textUpToCursor.lastIndexOf('{{');

		if (lastDoubleOpenBraceIndex !== -1) {
			const typedAfterBraces = textUpToCursor.slice(lastDoubleOpenBraceIndex + 2);
			setFilterText(typedAfterBraces);
			setShowDropdown(true);
			setHighlightedIndex(0);
			const { top, left } = calculateDoubleCurlyBracePosition(input, lastDoubleOpenBraceIndex);
			setDropdownPosition({ top, left });
		} else {
			setShowDropdown(false);
			setFilterText('');
		}
	};

	const handleKeyDown = e => {
		if (e.key === '{') {
			const input = inputRef.current;
			const cursorPosition = input.selectionStart;
			const textUpToCursor = input.value.slice(0, cursorPosition);

			if (textUpToCursor.slice(-1) === '{') {
				setShowDropdown(true);
				const lastDoubleOpenBraceIndex = textUpToCursor.lastIndexOf('{{');
				const { top, left } = calculateDoubleCurlyBracePosition(input, lastDoubleOpenBraceIndex);
				setDropdownPosition({ top, left });
				setFilterText('');
				setHighlightedIndex(0);
			}
		} else if (showDropdown) {
			if (e.key === 'ArrowDown') {
				e.preventDefault();
				setHighlightedIndex(prevIndex =>
					prevIndex === filteredOptions.length - 1 ? 0 : prevIndex + 1
				);
			} else if (e.key === 'ArrowUp') {
				e.preventDefault();
				setHighlightedIndex(prevIndex =>
					prevIndex === 0 ? filteredOptions.length - 1 : prevIndex - 1
				);
			} else if (e.key === 'Enter') {
				e.preventDefault();
				handleOptionSelect(filteredOptions[highlightedIndex]);
			} else if (e.key === 'Escape') {
				e.preventDefault();
				setShowDropdown(false);
			}
		}
	};

	const handleOptionSelect = option => {
		const input = inputRef.current;
		const cursorPosition = input.selectionStart;
		const textUpToCursor = text.slice(0, cursorPosition);
		const lastDoubleOpenBraceIndex = textUpToCursor.lastIndexOf('{{');

		const newText =
			textUpToCursor.slice(0, lastDoubleOpenBraceIndex + 2) +
			option +
			'}}' +
			text.slice(cursorPosition);

		setText(newText);
		setShowDropdown(false);
		setFilterText('');

		setTimeout(() => {
			input.focus();
			input.selectionEnd = lastDoubleOpenBraceIndex + option.length + 4;
		}, 0);
	};

	const calculateDoubleCurlyBracePosition = (input, braceIndex) => {
		const { scrollTop, scrollLeft, offsetTop, offsetLeft } = input;
		const inputStyle = window.getComputedStyle(input);
		const lineHeight = parseInt(inputStyle.lineHeight) || 20;
		const charWidth = parseInt(inputStyle.fontSize) / 2;

		const textUpToBraces = input.value.slice(0, braceIndex + 2);
		const lines = textUpToBraces.split('\n');
		const currentLine = lines[lines.length - 1];

		const top = offsetTop + (lines.length - 1) * lineHeight - scrollTop;
		const left = offsetLeft + (currentLine.length - 2) * charWidth - scrollLeft;

		return { top, left };
	};

	return {
		text,
		setText,
		showDropdown,
		dropdownPosition,
		filterText,
		highlightedIndex,
		filteredOptions,
		handleChange,
		handleKeyDown,
		handleOptionSelect,
		inputRef
	};
};

export default useAutocompleteDropdown;

// example usage
// <div style={{ position: 'relative' }}>
// 				<input ref={inputRef} value={text} onChange={handleChange} onKeyDown={handleKeyDown} />

// 				{showDropdown && filteredOptions.length > 0 && (
// 					<ul
// 						style={{
// 							position: 'absolute',
// 							top: dropdownPosition.top + 20,
// 							left: dropdownPosition.left,
// 							backgroundColor: 'white',
// 							border: '1px solid #ccc',
// 							listStyle: 'none',
// 							padding: '5px',
// 							margin: 0,
// 							cursor: 'pointer'
// 						}}
// 					>
// 						{filteredOptions.map((option, index) => (
// 							<li
// 								key={index}
// 								onClick={() => handleOptionSelect(option)}
// 								style={{
// 									padding: '5px',
// 									backgroundColor: highlightedIndex === index ? '#ddd' : 'white'
// 								}}
// 							>
// 								{option}
// 							</li>
// 						))}
// 					</ul>
// 				)}
// 			</div>

import { TasksDataReturnType } from 'controllers/task';
import { Dispatch, SetStateAction, useEffect, useRef, useState } from 'react';

interface UseAutocompleteDropdownProps {
	options: { label: string; value: string }[];
	value?: string;
	setValue: Dispatch<SetStateAction<string>>;
	setSelectedVariables: Dispatch<SetStateAction<Record<string, string>[]>>;
	setModalOpen: Dispatch<SetStateAction<string>>;
	initialState?: TasksDataReturnType['variables'];
	setCurrentInput: Dispatch<SetStateAction<string>>;
}

interface DropdownPosition {
	top: number;
	left: number;
}

const useAutocompleteDropdown = ({
	options,
	value,
	setValue,
	setSelectedVariables,
	setModalOpen,
	initialState,
	setCurrentInput
}: UseAutocompleteDropdownProps) => {
	const [showDropdown, setShowDropdown] = useState(false);
	const [dropdownPosition, setDropdownPosition] = useState<DropdownPosition>({ top: 0, left: 0 });
	const [filterText, setFilterText] = useState('');
	const [highlightedIndex, setHighlightedIndex] = useState(0);

	const inputRef = useRef(null);

	const filteredOptions = [
		...options.filter(option => option.label.toLowerCase().startsWith(filterText.toLowerCase())),
		{ label: 'Create new variable', value: 'create_new' }
	];

	useEffect(() => {
		if (showDropdown && highlightedIndex >= filteredOptions.length) {
			setHighlightedIndex(0);
		}
	}, [filteredOptions.length, highlightedIndex, showDropdown]);

	useEffect(() => {
		if (initialState) {
			const selectedFromInitialState = initialState.filter(variable =>
				value?.includes(`{${variable.name}}`)
			);
			setSelectedVariables(
				selectedFromInitialState.map(variable => ({
					label: variable.name,
					value: variable._id.toString()
				}))
			);
		}
	}, [initialState, value, setSelectedVariables]);

	const handleNewVariableCreation = (newVariable: { label: string; value: string }) => {
		setValue(prevValue => `${prevValue}${newVariable.label}}`);
		setSelectedVariables(prev => [...prev, newVariable]);
		setShowDropdown(false);
		setFilterText('');
		setModalOpen(null);
	};

	const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const input = inputRef.current;
		const cursorPosition = input.selectionStart;
		const newText = e.target.value;
		setValue(newText);

		const textUpToCursor = newText.slice(0, cursorPosition);
		const lastOpenBraceIndex = textUpToCursor.lastIndexOf('{');

		if (lastOpenBraceIndex !== -1 && textUpToCursor.slice(lastOpenBraceIndex + 1).trim() === '') {
			const typedAfterBraces = textUpToCursor.slice(lastOpenBraceIndex + 2);
			setFilterText(typedAfterBraces);
			setShowDropdown(true);
			setHighlightedIndex(0);
			const { top, left } = calculateDoubleCurlyBracePosition(input, lastOpenBraceIndex);
			setDropdownPosition({ top, left });
		} else {
			setShowDropdown(false);
			setFilterText('');
		}

		setSelectedVariables(prevSelectedVariables =>
			prevSelectedVariables.filter(variable => newText.includes(variable.label))
		);
	};

	const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		if (e.key === '{') {
			const input = inputRef.current;
			const cursorPosition = input.selectionStart;
			const textUpToCursor = input.value.slice(0, cursorPosition);

			if (textUpToCursor.slice(-1) === '{') {
				setShowDropdown(true);
				const lastOpenBraceIndex = textUpToCursor.lastIndexOf('{');
				const { top, left } = calculateDoubleCurlyBracePosition(input, lastOpenBraceIndex);
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

	const handleOptionSelect = (option: { label: string; value: string }) => {
		if (option.value === 'create_new') {
			setModalOpen('variable');
			setCurrentInput(inputRef.current?.name || null);
			return;
		}
		const input = inputRef.current;
		const cursorPosition = input.selectionStart;
		const textUpToCursor = value.slice(0, cursorPosition);
		const lastOpenBraceIndex = textUpToCursor.lastIndexOf('{');

		const newText =
			textUpToCursor.slice(0, lastOpenBraceIndex + 2) +
			option.label +
			'}' +
			value.slice(cursorPosition);

		setValue(newText);
		setSelectedVariables(prev => [...prev, option]);
		setShowDropdown(false);
		setFilterText('');

		setTimeout(() => {
			input.focus();
			input.selectionEnd = newText.length;
		}, 0);
	};

	const calculateDoubleCurlyBracePosition = (
		input: HTMLInputElement,
		braceIndex: number
	): DropdownPosition => {
		const { scrollTop, scrollLeft, offsetTop, offsetLeft } = input;
		const inputStyle = window.getComputedStyle(input);
		const lineHeight = parseInt(inputStyle.lineHeight) || 20;
		const charWidth = parseInt(inputStyle.fontSize) / 2;

		const textUpToBraces = input.value.slice(0, braceIndex + 2);
		const lines = textUpToBraces.split('\n');
		const currentLine = lines[lines.length - 1];

		const top = offsetTop + (lines.length - 1) * lineHeight - scrollTop + 25;
		const left = offsetLeft + (currentLine.length - 2) * charWidth - scrollLeft + 25;

		return { top, left };
	};

	return {
		text: value,
		setText: setValue,
		showDropdown,
		dropdownPosition,
		highlightedIndex,
		filteredOptions,
		handleChange,
		handleKeyDown,
		handleOptionSelect,
		inputRef,
		handleNewVariableCreation
	};
};

export default useAutocompleteDropdown;

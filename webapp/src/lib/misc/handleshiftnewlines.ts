'use strict';

export default async function handleShiftNewlines(
	e,
	value,
	onSubmit,
	setInputValue,
	scrollToBottom?,
	chatBusyState?
) {
	scrollToBottom && scrollToBottom();
	if (e.key === 'Enter' && !e.shiftKey) {
		e.preventDefault();
		if (chatBusyState) {
			return;
		}
		if (value.trim().length > 0) {
			const success = await onSubmit(e);
			success && setInputValue('');
		}
	}
}

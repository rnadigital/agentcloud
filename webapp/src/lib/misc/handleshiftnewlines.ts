'use strict';

export default async function handleShiftNewlines(
	e,
	value,
	onSubmit,
	setInputValue,
	scrollToBottom?,
	chatBusyState?,
	showConversationStarters?
) {
	scrollToBottom && scrollToBottom();
	if (e.key === 'Enter' && !e.shiftKey) {
		e.preventDefault();
		if (chatBusyState && !showConversationStarters) {
			return;
		}
		if (value.trim().length > 0) {
			const success = await onSubmit(e);
			success && setInputValue('');
		}
	}
}

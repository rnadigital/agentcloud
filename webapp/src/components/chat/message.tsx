import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import React, { useState, useEffect } from 'react';
import { ClipboardDocumentIcon } from '@heroicons/react/20/solid';
import Markdown from 'react-markdown';
import { toast } from 'react-toastify';

export function CopyToClipboardButton({ dataToCopy }) {

	const handleCopyClick = async () => {
	 	try {
			await navigator.clipboard.writeText(dataToCopy);
			toast.success('Copied to clipboard');
		} catch { /* ignored for now */ }
	};

	return (
		<button 
			onClick={handleCopyClick} 
			className='px-1 hover:bg-blue-600 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-300'
			aria-label='Copy to clipboard'
		>
			<ClipboardDocumentIcon className='h-4 w-4 text-white' />
		</button>
	);
}

function MessageBody({ message, messageType, messageLanguage, style }) {
	const messageContent = messageLanguage === 'json'
		? JSON.stringify(message, null, '\t')
		: message.toString();
	const isLongMessage = messageContent
		&& typeof messageContent.split === 'function'
		&& messageContent.split(/\r?\n/).length > 10;
	const [ collapsed, setCollapsed ] = useState(isLongMessage);
	switch(messageType) {
		case 'code':
			return <>
				<span className='h-8 bg-gray-700 p-2 text-white w-full block text-xs ps-2 flex justify-between'>
					{messageLanguage}
					<CopyToClipboardButton dataToCopy={messageContent} />
				</span>
				<div className='overlay-container'>
					<SyntaxHighlighter
						wrapLongLines
						className={collapsed ? 'overlay-gradient' : null}
						language={messageLanguage}
						style={style}
						showLineNumbers={true}
						customStyle={{ margin: 0, maxHeight: collapsed ? '10em' : 'unset' }}
					>
						{messageContent}
					</SyntaxHighlighter>
					<button
						className='overlay-button'
						onClick={() => {
							setCollapsed(oldCollapsed => !oldCollapsed);
						}}
					>
						{collapsed ? 'Expand' : 'Collapse'}
					</button>
				</div>
			</>;
		case 'text':
		default:
			return <Markdown
				className={'markdown-content'}
			>
				{message}
			</Markdown>;
	}
}

export function Message({ message, messageType, messageLanguage, isFeedback, date, authorName, authorImage, incoming }
	: { message?: any, messageType?: string, messageLanguage?: string, isFeedback?: boolean, date?: Date, authorName?: string, authorImage?: string, incoming?: boolean }) {

	const [ style, setStyle ] = useState(null);
	useEffect(() => {
		if (!style) {
			import('react-syntax-highlighter/dist/esm/styles/prism/material-dark')
				.then(mod => setStyle(mod.default));
		}
	});
	
	if (!style) { return null; }

	const authorSection = <div className={`w-9 h-9 rounded-full flex items-center justify-center ${incoming ? 'ms-2' : 'me-2'} select-none`}>
		<span className='w-8 h-8 rounded-full text-center pt-1 font-bold ring-1 ring-gray-300'>{authorName.charAt(0).toUpperCase()}</span>		
	</div>;

	return <>
		<div className={`grid grid-cols-1 xl:grid-cols-5 border-t ${incoming ? 'bg-white' : 'bg-gray-50'}`}>
			<div className='invisible xl:visible col-span-1'></div>
			<small className={`flex px-2 pt-4 col-span-1 xl:col-span-3 ${incoming ? 'justify-end' : ''}`}>
				<strong className='capitalize'>{authorName}</strong>
				{date && ' - ' + new Date(date).toLocaleString()}
			</small>
			<div className='invisible xl:visible col-span-1'></div>
		</div>
		<div className={`grid grid-cols-1 xl:grid-cols-5 ${incoming ? 'bg-white' : 'bg-gray-50'}`}>
			<div className='invisible xl:visible col-span-1'></div>
			<div className={`flex ${incoming ? 'pe-2 justify-end' : 'ps-2 justify-start'} px-4 pb-4 pt-1 col-span-1 xl:col-span-3`}>
				{!incoming && authorSection}
				<div className={`flex max-w-96 ${incoming ? 'bg-indigo-500' : 'bg-white'} rounded-lg ${messageType !== 'code' ? 'p-3' : ''} overflow-x-auto`}>
					<p className={`${incoming ? 'text-white' : ''} w-full`}>
						<MessageBody message={message} messageType={messageType} messageLanguage={messageLanguage} style={style} />
					</p>
				</div>
				{incoming && authorSection}
			</div>
			<div className='invisible xl:visible col-span-1'></div>
		</div>
	</>;

}

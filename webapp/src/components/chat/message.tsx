import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import React, { useState, useEffect } from 'react';

function getMessageSection(message, messageType, messageLanguage, style) {
	switch(messageType) {
		case 'code':
			return <SyntaxHighlighter language={messageLanguage} style={style}>
				{messageLanguage === 'json' ? JSON.stringify(message, null, '\t') : message}
			</SyntaxHighlighter>;
		case 'text':
		default:
			return <pre style={{ whiteSpace: 'pre-wrap' }}>
				{message}
			</pre>;
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
				<div className={`flex max-w-96 ${incoming ? 'bg-indigo-500' : 'bg-white'} rounded-lg p-3 gap-3 overflow-x-auto`}>
					<p className={incoming ? 'text-white' : ''}>
						{getMessageSection(message, messageType, messageLanguage, style)}
					</p>
				</div>
				{incoming && authorSection}
			</div>
			<div className='invisible xl:visible col-span-1'></div>
		</div>
	</>;

}

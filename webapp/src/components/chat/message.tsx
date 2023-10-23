import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import React, { useState, useEffect } from 'react';

export function OutgoingMessage({ message, messageType, messageLanguage, date, authorName, authorImage }: { message?: any, messageType?: string, messageLanguage?: string, date?: Date, authorName?: string, authorImage?: string }) {

	const [ style, setStyle ] = useState(null);
	useEffect(() => {
		if (!style) {
			import('react-syntax-highlighter/dist/esm/styles/prism/material-dark')
				.then(mod => setStyle(mod.default));
		}
	});
	if (!style) { return null; }

	return <div className='grid grid-cols-1 xl:grid-cols-5 bg-gray-50 border-t'>
		<div className='invisible xl:visible col-span-1'></div>
		<div className='flex ps-2 p-4 col-span-1 xl:col-span-3'>
			<div className='w-9 h-9 rounded-full flex items-center justify-center mr-2 select-none'>
				<span className='w-8 h-8 rounded-full text-center pt-1 font-bold ring-1 ring-gray-300'>{authorName.charAt(0).toUpperCase()}</span>
			</div>
			<div className='flex max-w-96 bg-white rounded-lg p-3 gap-3 overflow-x-auto'>
				<p className='text-gray-700'>
					{messageType === 'code'
						? (<SyntaxHighlighter language={messageLanguage} style={style}>
							{messageLanguage === 'json' ? JSON.stringify(message, null, '\t') : message}
						</SyntaxHighlighter>)
						: <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>}
				</p>
			</div>
		</div>
		<div className='invisible xl:visible col-span-1'></div>
	</div>;

}

export function IncomingMessage({ message, messageType, messageLanguage, date, authorName, authorImage }: { message?: any, messageType?: string, messageLanguage?: string, date?: Date, authorName?: string, authorImage?: string }) {

	const [ style, setStyle ] = useState(null);
	useEffect(() => {
		if (!style) {
			import('react-syntax-highlighter/dist/esm/styles/prism/material-dark')
				.then(mod => setStyle(mod.default));
		}
	});
	if (!style) { return null; }

	return <div className='grid grid-cols-1 xl:grid-cols-5 border-t'>
		<div className='invisible xl:visible col-span-1'></div>
		<div className='flex justify-end pe-2 p-4 col-span-1 xl:col-span-3'>
			<div className='flex max-w-96 bg-indigo-500 text-white rounded-lg p-3 gap-3 overflow-x-auto'>
				<p>
					{messageType === 'code'
						? (<SyntaxHighlighter language={messageLanguage} style={style}>
							{messageLanguage === 'json' ? JSON.stringify(message, null, '\t') : message}
						</SyntaxHighlighter>)
						: <pre style={{ whiteSpace: 'pre-wrap' }}>{message}</pre>}
				</p>
			</div>
			<div className='w-9 h-9 rounded-full flex items-center justify-center ml-2 select-none'>
				<span className='w-8 h-8 rounded-full text-center pt-1 font-bold ring-1 ring-gray-300'>{authorName.charAt(0).toUpperCase()}</span>
			</div>
		</div>
		<div className='invisible xl:visible col-span-1'></div>
	</div>;

}

import { CheckCircleIcon,ClipboardDocumentIcon } from '@heroicons/react/20/solid';
import AgentAvatar from 'components/AgentAvatar';
import ButtonSpinner from 'components/ButtonSpinner';
import { relativeString } from 'misc/time';
import dynamic from 'next/dynamic';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { FeedbackOption } from 'struct/session';

import { useChatContext } from '../../context/chat';

// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false,
});
import Blockies from 'react-blockies';
import { toast } from 'react-toastify';

const COLLAPSE_AFTER_LINES = 10;

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

function CollapsingCodeBody({ messageLanguage, messageContent, style, chunking }) {
	const isLongMessage = messageContent
		&& typeof messageContent.split === 'function'
		&& messageContent.split(/\r?\n/).length > COLLAPSE_AFTER_LINES;
	const [ collapsed, setCollapsed ] = useState(isLongMessage && !chunking);
	const codeBlockRef = useRef(null);
	const PreWithRef = (preProps) => {
		// console.log(preProps);
		return (
			<pre {...preProps} ref={codeBlockRef} />
		);
	};
	const cachedResult = useMemo(() => <>
		<span className='rounded-t overflow-hidden h-8 bg-gray-700 p-2 text-white w-full block text-xs ps-2 flex justify-between'>
			{messageLanguage}
			<CopyToClipboardButton dataToCopy={messageContent} />
		</span>
		<div className={isLongMessage ? 'overlay-container' : ''}>
			<SyntaxHighlighter
				wrapLongLines
				className={collapsed ? 'overlay-gradient' : null}
				language={messageLanguage}
				style={style}
				showLineNumbers={true}
				PreTag={PreWithRef}
				customStyle={{ margin: 0, maxHeight: collapsed ? '10em' : 'unset' }}
			>
				{messageContent}
			</SyntaxHighlighter>
			{isLongMessage && !chunking && <button
				className='overlay-button btn bg-indigo-600 rounded-md text-white'
				onClick={() => {
					setCollapsed(oldCollapsed => !oldCollapsed);
				}}
			>
				{collapsed ? 'Expand' : 'Collapse'}
			</button>}
		</div>
	</>, [collapsed, messageContent]);
	return cachedResult;
}

function MessageBody({ message, messageType, messageLanguage, style, chunking }) {
	let messageContent = messageLanguage === 'json'
		? JSON.stringify(message, null, '\t')
		: message.toString();
	return useMemo(() => {
		switch (messageType) {
			case 'code':
				return <CollapsingCodeBody
					messageContent={messageContent}
					messageLanguage={messageLanguage}
					style={style}
					chunking={chunking}
				/>;
			case 'text':
			default:
				return <Markdown
					className={'markdown-content'}
					components={{
						code(props) {
							const { children, className, node, ...rest } = props;
							const match = /language-(\w+)/.exec(className || '');
							return match ? (<CollapsingCodeBody
								messageContent={String(children).replace(/\n$/, '')}
								messageLanguage={match[1]}
								style={style}
								chunking={chunking}
							/>) : (<code {...rest} className={className}>
								{children}
							</code>);
						}
					}}
				>
					{message}
				</Markdown>;
		}
	}, [messageContent, messageType, messageLanguage, style, chunking]);
}

export function Message({
	prevMessage,
	message,
	messageType,
	messageLanguage,
	isFeedback,
	feedbackOptions,
	isLastMessage,
	isLastSeen,
	ts,
	authorName,
	avatar,
	incoming,
	sendMessage,
	chunking,
	displayType,
	tokens,
	completed,
}: {
		prevMessage?: any,
		message?: any,
		messageType?: string,
		messageLanguage?: string,
		isFeedback?: boolean,
		feedbackOptions?: string[],
		isLastMessage?: boolean,
		isLastSeen?: boolean,
		ts?: number,
		authorName?: string,
		avatar?: any,
		incoming?: boolean,
		sendMessage?: Function,
		chunking?: boolean,
		displayType?: string,
		tokens?: number,
		completed?: boolean,
	}) {

	const [chatContext]: any = useChatContext();

	const [ style, setStyle ] = useState(null);
	try {
		useEffect(() => {
			if (!style) {
				import('react-syntax-highlighter/dist/esm/styles/prism/material-dark')
					.then(mod => setStyle(mod.default));
			}
		}, []);
	} catch (e) {
		console.error(e);
	}
	
	if (!style) { return null; }

	const sameAuthorAsPrevious = prevMessage && (prevMessage.authorName === authorName || prevMessage.authorName.toLowerCase() === 'system');
	const messageDate = new Date(ts);
	const today = Date.now() - ts < 86400000;
	const dateString = messageDate.toLocaleString();
	const relativeDateString = relativeString(new Date(), messageDate);
	const isThought = message?.split('\n').slice(-8).some(line => line.toLowerCase().startsWith('action input:')) || (message?.startsWith('Thought:') && !message.includes('Final Answer:'));

	const profilePicture = <div className={`min-w-max w-9 h-9 rounded-full flex items-center justify-center ${incoming ? 'ms-2' : 'me-2'} select-none`}>
		<span className={`overflow-hidden w-8 h-8 rounded-full text-center font-bold ring-gray-300 ${!sameAuthorAsPrevious && 'ring-1'}`}>
			{!sameAuthorAsPrevious && avatar && <AgentAvatar agent={avatar} size={8} />}
		</span>
	</div>;

	if (displayType === 'inline') { //TODO: enum and handle "other" types not just like bubble
		return <div className={`grid grid-cols-1 xl:grid-cols-5 pb-2 bg-gray-50 dark:bg-slate-700 ${isFeedback && isLastMessage ? 'bg-yellow-50 dark:bg-yellow-800' : ''}`}>
			<div className='invisible xl:visible col-span-1'></div>
			<div className={`me-auto ${incoming ? 'pe-2 justify-end' : 'ps-2 justify-start'} col-span-1 xl:col-span-3`}>
				<div className='flex text-sm text-white px-2 ms-11 col-span-1 xl:col-span-3 py-2 bg-slate-700 rounded-lg'>
					{completed ? <CheckCircleIcon className='fill-green-600 h-5 me-2' /> : <ButtonSpinner size={18} className='ms-1 me-2' />}
					{message}
				</div>
			</div>
			<div className='invisible xl:visible col-span-1'></div>
		</div>;
	}

	const authorNameSection = !sameAuthorAsPrevious && <div className={`grid grid-cols-1 xl:grid-cols-5 ${prevMessage && !sameAuthorAsPrevious ? 'border-t dark:border-slate-600' : ''} ${incoming ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800'} ${isFeedback && isLastMessage ? 'bg-yellow-50 dark:bg-yellow-800' : ''}`}>
		<div className='invisible xl:visible col-span-1'></div>
		<small className={`flex px-2 pt-4 col-span-1 xl:col-span-3 ${incoming ? 'justify-end' : ''}`}>
			<strong className='capitalize pe-1'>{authorName.replaceAll('_', ' ')}</strong>
		</small>
		<div className='invisible xl:visible col-span-1'></div>
	</div>;

	const messageBodySection = <div className={`shadow-sm flex max-w-96 transition-colors ${incoming ? 'bg-indigo-500' : isThought ? 'bg-slate-700 text-white' : 'bg-white dark:bg-slate-900'} rounded-lg ${messageType !== 'code' ? 'px-3 py-2' : 'p-2'} overflow-x-auto  ${isFeedback && isLastMessage ? 'border border-yellow-200 dark:bg-yellow-700 dark:border-yellow-600' : ''}`}>
		<div className={`${incoming ? 'text-white' : ''} w-full`}>
			{isThought
				? <details>
					<summary className='cursor-pointer'>Thought Process:</summary>
					<MessageBody message={message} messageType={messageType} messageLanguage={messageLanguage} style={style} chunking={chunking} />
				</details>		
				: <MessageBody message={message} messageType={messageType} messageLanguage={messageLanguage} style={style} chunking={chunking} />}
			<small className={`flex justify-end pt-1 ${incoming ? 'text-indigo-300' : isThought ? 'text-gray-300' : 'text-gray-500 dark:text-white'}`}>
				{tokens > 0 && <span className='me-1'>{tokens.toLocaleString()} token{tokens === 1 ? '' : 's'} - </span>}
				<time className='cursor-pointer' title={today ? dateString : relativeDateString} dateTime={messageDate.toISOString()}>{today ? relativeDateString : dateString}</time>
			</small>
		</div>
	</div>;

	return <>
		{authorNameSection}
		<div className={`grid grid-cols-1 xl:grid-cols-5 pb-2 ${incoming ? 'bg-white dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-800'} ${isFeedback && isLastMessage ? 'bg-yellow-50 dark:bg-yellow-800' : ''} ${isLastSeen && !isLastMessage && !isFeedback ? 'border-b border-red-500' : ''}`}>
			<div className='invisible xl:visible col-span-1'></div>
			<div className={`flex ${incoming ? 'pe-2 justify-end' : 'ps-2 justify-start'} px-4 pt-1 col-span-1 xl:col-span-3`}>
				{!incoming && profilePicture}
				{messageBodySection}
				{incoming && profilePicture}
			</div>
			<div className='invisible xl:visible col-span-1'></div>
		</div>
	</>;

}

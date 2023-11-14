import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { ClipboardDocumentIcon, ChatBubbleLeftIcon } from '@heroicons/react/20/solid';
import { useChatContext } from '../../context/chat';
import { relativeString } from '../../lib/time';
import dynamic from 'next/dynamic';
import { FeedbackOption, SessionType } from '../../lib/struct/session';

// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false,
});
import { toast } from 'react-toastify';
import Blockies from 'react-blockies';

const COLLAPSE_AFTER_LINES = 10
	, feedbackLabels = {
		[SessionType.TEAM]: {
			[FeedbackOption.EXIT]: 'Accept team',
			[FeedbackOption.CONTINUE]: 'Auto reply',
			[FeedbackOption.CANCEL]: 'End session',
		},
		[SessionType.TASK]: {
			// [FeedbackOption.EXIT]: 'Continue',
			[FeedbackOption.CONTINUE]: 'Continue',
			[FeedbackOption.CANCEL]: 'End session',
		},
	}
	, feedbackMessages = {
		[SessionType.TEAM]: {
			[FeedbackOption.EXIT]: 'exit',
			[FeedbackOption.CONTINUE]: '',
			[FeedbackOption.CANCEL]: 'TERMINATE',
		},
		[SessionType.TASK]: {
			// [FeedbackOption.EXIT]: 'Looks good!',
			[FeedbackOption.CONTINUE]: '',
			[FeedbackOption.CANCEL]: 'TERMINATE',
		},
	};

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
	const PreWithRef = (preProps) => (
		<pre {...preProps} ref={codeBlockRef} />
	);
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
	const messageContent = messageLanguage === 'json'
		? JSON.stringify(message, null, '\t')
		: message.toString();
	return useMemo(() => {
		switch(messageType) {
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
	ts,
	authorName,
	authorImage,
	incoming,
	sendMessage,
	chunking,
	displayMessage,
	tokens,
}: {
		prevMessage?: any,
		message?: any,
		messageType?: string,
		messageLanguage?: string,
		isFeedback?: boolean,
		feedbackOptions?: string[],
		isLastMessage?: boolean,
		ts?: number,
		authorName?: string,
		authorImage?: string,
		incoming?: boolean,
		sendMessage?: Function,
		chunking?: boolean,
		displayMessage?: string,
		tokens?: number,
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
	} catch(e){
		console.error(e);
	}
	
	if (!style) { return null; }

	const sameAuthorAsPrevious = prevMessage && prevMessage.authorName === authorName;
	const messageDate = new Date(ts);
	const today = Date.now() - ts < 86400000;
	const dateString = messageDate.toLocaleString();
	const relativeDateString = relativeString(new Date(), messageDate);

	if (displayMessage) {
		return <div className={`grid grid-cols-1 xl:grid-cols-5 pb-2 bg-gray-50 ${isFeedback && isLastMessage ? 'bg-yellow-50' : ''}`}>
			<div className='invisible xl:visible col-span-1'></div>
			<div className={`text-sm text-gray-500 m-auto flex ${incoming ? 'pe-2 justify-end' : 'ps-2 justify-start'} px-4 pt-1 col-span-1 xl:col-span-3 pt-4 pb-2`}>
				<ChatBubbleLeftIcon width={14} className='mx-1' /> {displayMessage}
			</div>
			<div className='invisible xl:visible col-span-1'></div>
		</div>;
	}

	const profilePicture = <div className={`min-w-max w-9 h-9 rounded-full flex items-center justify-center ${incoming ? 'ms-2' : 'me-2'} select-none`}>
		<span className={`overflow-hidden w-8 h-8 rounded-full text-center font-bold ring-gray-300 ${!sameAuthorAsPrevious && 'ring-1'}`}>
			{!sameAuthorAsPrevious && <Blockies seed={authorName} />}
		</span>
	</div>;

	const authorNameSection = !sameAuthorAsPrevious && <div className={`grid grid-cols-1 xl:grid-cols-5 ${prevMessage && !sameAuthorAsPrevious ? 'border-t' : ''} ${incoming ? 'bg-white' : 'bg-gray-50'} ${isFeedback && isLastMessage ? 'bg-yellow-50' : ''}`}>
		<div className='invisible xl:visible col-span-1'></div>
		<small className={`flex px-2 pt-4 col-span-1 xl:col-span-3 ${incoming ? 'justify-end' : ''}`}>
			<strong className='capitalize pe-1'>{authorName.replaceAll('_', ' ')}</strong>
		</small>
		<div className='invisible xl:visible col-span-1'></div>
	</div>;

	return <>
		{authorNameSection}
		<div className={`grid grid-cols-1 xl:grid-cols-5 pb-2 ${incoming ? 'bg-white' : 'bg-gray-50'} ${isFeedback && isLastMessage ? 'bg-yellow-50' : ''}`}>
			<div className='invisible xl:visible col-span-1'></div>
			<div className={`flex ${incoming ? 'pe-2 justify-end' : 'ps-2 justify-start'} px-4 pt-1 col-span-1 xl:col-span-3`}>
				{!incoming && profilePicture}
				<div className={`flex max-w-96 ${incoming ? 'bg-indigo-500' : 'bg-white'} rounded-lg ${messageType !== 'code' ? 'px-3 py-2' : 'p-2'} overflow-x-auto  ${isFeedback && isLastMessage ? 'border border-yellow-200' : ''}`}>
					<p className={`${incoming ? 'text-white' : ''} w-full`}>
						<MessageBody message={message} messageType={messageType} messageLanguage={messageLanguage} style={style} chunking={chunking} />
						<small className={`flex justify-end pt-1 ${incoming ? 'text-indigo-300' : 'text-gray-500'}`}>
							{tokens > 0 && <span className='me-1'>{tokens.toLocaleString()} token{tokens === 1 ? '' : 's'} - </span>}
							<time className='cursor-pointer' title={today ? dateString : relativeDateString} dateTime={messageDate.toISOString()}>{today ? relativeDateString : dateString}</time>
						</small>
					</p>
				</div>
				{incoming && profilePicture}
			</div>
			<div className='invisible xl:visible col-span-1'></div>
		</div>

		{chatContext && isFeedback && isLastMessage && <div className={`grid grid-cols-1 xl:grid-cols-5 pb-2 ${incoming ? 'bg-white' : 'bg-gray-50'} bg-yellow-50`}>
			<div className='invisible xl:visible col-span-1'></div>
			<div className={`flex ${incoming ? 'pe-2 justify-end' : 'ps-2 justify-start'} px-4 pt-1 col-span-1 xl:col-span-3`}>
				{feedbackOptions && chatContext?.type && feedbackOptions.map((fo, oi) => feedbackMessages[chatContext.type][fo] && (<div key={`feedbackOptions_${ts}_${oi}`}>
					<button
						className='p-1 px-2 btn bg-indigo-600 rounded-md text-white me-2 capitalize'
						onClick={(e) => {
							e.preventDefault();
							sendMessage(feedbackMessages[chatContext.type][fo], { displayMessage: feedbackLabels[chatContext.type][fo] });
						}}
					>
						{feedbackLabels[chatContext.type][fo]}
					</button>
				</div>)).filter(n => n)}
			</div>
			<div className='invisible xl:visible col-span-1'></div>
		</div>}
	</>;

}

import * as API from '@api';
import { CheckCircleIcon, ClipboardDocumentIcon } from '@heroicons/react/20/solid';
import AgentAvatar from 'components/AgentAvatar';
import ButtonSpinner from 'components/ButtonSpinner';
import { useChatContext } from 'context/chat';
import { relativeString } from 'misc/time';
import dynamic from 'next/dynamic';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';

// @ts-ignore
const Markdown = dynamic(() => import('react-markdown'), {
	loading: () => <p className='markdown-content'>Loading...</p>,
	ssr: false
});
import { useAccountContext } from 'context/account';
import cn from 'utils/cn';
import { useRouter } from 'next/router';
import { usePostHog } from 'posthog-js/react';
import { toast } from 'react-toastify';

import ChatRestartMessage from './ChatRestartMessage';

const COLLAPSE_AFTER_LINES = 10;
const ERROR_TEXTS = new Set(['⛔ An unexpected error occurred', '⛔ MAX_RECURSION_LIMIT REACHED']);

export function CopyToClipboardButton({ dataToCopy }) {
	const handleCopyClick = async () => {
		try {
			await navigator.clipboard.writeText(dataToCopy);
			toast.success('Copied to clipboard');
		} catch {
			/* ignored for now */
		}
	};

	return (
		<button
			onClick={handleCopyClick}
			className='px-1 py-1 hover:bg-blue-600 hover:text-white text-gray-900 rounded-md shadow focus:outline-none focus:ring-2 focus:ring-blue-300'
			aria-label='Copy to clipboard'>
			<ClipboardDocumentIcon className='h-5 w-5 ' />
		</button>
	);
}

function CollapsingCodeBody({ messageLanguage, messageContent, style, chunking }) {
	const isLongMessage =
		messageContent &&
		typeof messageContent.split === 'function' &&
		messageContent.split(/\r?\n/).length > COLLAPSE_AFTER_LINES;
	const [collapsed, setCollapsed] = useState(isLongMessage && !chunking);
	const codeBlockRef = useRef(null);
	const PreWithRef = preProps => {
		return <pre {...preProps} ref={codeBlockRef} />;
	};
	const cachedResult = useMemo(
		() => (
			<>
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
						customStyle={{ margin: 0, maxHeight: collapsed ? '10em' : 'unset' }}>
						{messageContent}
					</SyntaxHighlighter>
					{isLongMessage && !chunking && (
						<button
							className='overlay-button btn bg-indigo-600 rounded-md text-white'
							onClick={() => {
								setCollapsed(oldCollapsed => !oldCollapsed);
							}}>
							{collapsed ? 'Expand' : 'Collapse'}
						</button>
					)}
				</div>
			</>
		),
		[collapsed, messageContent]
	);
	return cachedResult;
}

const customMessages = {
	'MAX_RECURSION_LIMIT REACHED': ChatRestartMessage,
	'MAX_MESSAGES_LIMIT REACHED': ChatRestartMessage
};

function MessageBody({ message, messageType, messageLanguage, style, chunking }) {
	let messageContent =
		messageLanguage === 'json' ? JSON.stringify(message, null, '\t') : message.toString();
	return useMemo(() => {
		const CustomMessageBody = customMessages[message];
		if (CustomMessageBody) {
			return <CustomMessageBody />;
		}
		switch (messageType) {
			case 'code':
				return (
					<CollapsingCodeBody
						messageContent={messageContent}
						messageLanguage={messageLanguage}
						style={style}
						chunking={chunking}
					/>
				);
			case 'text':
			default:
				return (
					<Markdown
						className={'markdown-content'}
						components={{
							code(props) {
								const { children, className, node, ...rest } = props;
								const match = /language-(\w+)/.exec(className || '');
								return match ? (
									<CollapsingCodeBody
										messageContent={String(children).replace(/\n$/, '')}
										messageLanguage={match[1]}
										style={style}
										chunking={chunking}
									/>
								) : (
									<code {...rest} className={className}>
										{children}
									</code>
								);
							}
						}}>
						{message}
					</Markdown>
				);
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
	agent,
	incoming,
	chunking,
	displayType,
	tokens,
	completed
}: {
	prevMessage?: any;
	message?: any;
	messageType?: string;
	messageLanguage?: string;
	isFeedback?: boolean;
	feedbackOptions?: string[];
	isLastMessage?: boolean;
	isLastSeen?: boolean;
	ts?: number;
	authorName?: string;
	agent?: any;
	incoming?: boolean;
	chunking?: boolean;
	displayType?: string;
	tokens?: number;
	completed?: boolean;
}) {
	const [chatContext]: any = useChatContext();

	const [accountContext]: any = useAccountContext();
	const { account, csrf, switching } = accountContext as any;
	const router = useRouter();
	const posthog = usePostHog();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;

	const restartSession = () => {
		posthog.capture('restartSession', {
			appId: chatContext?.app._id,
			appType: chatContext?.app.type,
			appName: chatContext?.app.name
		});
		API.addSession(
			{
				_csrf: csrf,
				resourceSlug,
				id: chatContext?.app?._id
			},
			null,
			toast.error,
			router
		);
	};

	const [style, setStyle] = useState(null);
	try {
		useEffect(() => {
			if (!style) {
				import('react-syntax-highlighter/dist/esm/styles/prism/material-dark').then(mod =>
					setStyle(mod.default)
				);
			}
		}, []);
	} catch (e) {
		console.error(e);
	}

	if (!style) {
		return null;
	}

	const sameAuthorAsPrevious =
		prevMessage &&
		(prevMessage.authorName === authorName || prevMessage.authorName.toLowerCase() === 'system');
	const messageDate = new Date(ts);
	const today = Date.now() - ts < 86400000;
	const dateString = messageDate.toLocaleString();
	const relativeDateString = relativeString(new Date(), messageDate);
	const isThought =
		(!isFeedback &&
			typeof message === 'string' &&
			message
				?.split('\n')
				.slice(-8)
				.some(line => line.toLowerCase().startsWith('action input:'))) ||
		(typeof message === 'string' &&
			message?.startsWith('Thought:') &&
			!message.includes('Final Answer:'));

	const profilePicture = (
		<div
			className={`min-w-max w-9 h-9 rounded-full flex items-center justify-center ${incoming ? 'ms-2 mt-auto' : 'me-2'} select-none`}>
			<span
				className={`overflow-hidden w-8 h-8 rounded-full text-center font-bold ring-gray-300 ring-1`}>
				<AgentAvatar agent={agent} size={8} />
			</span>
		</div>
	);

	if (displayType === 'inline') {
		//TODO: enum and handle "other" types not just like bubble
		return (
			<div
				className={`grid grid-cols-1 xl:grid-cols-5 pb-2 bg-gray-50 dark:bg-slate-900 ${isFeedback && isLastMessage ? 'bg-yellow-50 dark:bg-slate-800' : ''}`}>
				<div className='invisible xl:visible col-span-1'></div>
				<div
					className={`me-auto ${incoming ? 'pe-2 justify-end' : 'ps-2 justify-start'} col-span-1 xl:col-span-3`}>
					<div className='flex text-sm text-white px-2 ms-11 col-span-1 xl:col-span-3 py-2 bg-slate-700 rounded-lg'>
						{/* TODO: (tom) change how this works so bubles have a flag that says whether to show a spinner */}
						{!ERROR_TEXTS.has(message) ? (
							completed ? (
								<CheckCircleIcon className='fill-green-600 h-5 me-2' />
							) : (
								<ButtonSpinner size={18} className='ms-1 me-2' />
							)
						) : null}
						<MessageBody
							message={message}
							messageType={messageType}
							messageLanguage={messageLanguage}
							style={style}
							chunking={chunking}
						/>
					</div>
				</div>
				<div className='invisible xl:visible col-span-1'></div>
			</div>
		);
	}

	const authorNameSection = (
		/*!sameAuthorAsPrevious && */ <div
			className={cn(
				`grid grid-cols-1 xl:grid-cols-5 dark:text-white`,
				prevMessage && !sameAuthorAsPrevious ? 'dark:border-slate-900' : '',
				incoming ? 'bg-gray-50 dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-900',
				isFeedback && isLastMessage ? 'bg-yellow-50 dark:bg-slate-900' : ''
			)}>
			<div className='invisible xl:visible col-span-1'></div>
			<small className={`flex px-2 pt-4 col-span-1 xl:col-span-3 ${incoming ? 'justify-end' : ''}`}>
				<strong className='capitalize pe-1'>{authorName.replaceAll('_', ' ')}</strong>
			</small>
			<div className='invisible xl:visible col-span-1'></div>
		</div>
	);

	const messageBodySection = (
		<div
			className={cn(
				'shadow-sm flex transition-colors rounded-lg overflow-x-auto dark:text-white',
				incoming
					? 'bg-indigo-500'
					: isThought
						? 'bg-slate-800 text-white'
						: 'bg-white dark:bg-slate-900',
				incoming ? 'rounded-br-none' : 'rounded-tl-none',
				messageType !== 'code' ? 'px-3 py-2' : 'p-2 w-full'
			)}>
			<div className={`${incoming ? 'text-white' : ''} w-full`}>
				{isThought ? (
					<details open={isLastMessage}>
						<summary className='cursor-pointer text-sm'>Thought Process:</summary>
						<div className='mt-2 italic'>
							<MessageBody
								message={message}
								messageType={messageType}
								messageLanguage={messageLanguage}
								style={style}
								chunking={chunking}
							/>
						</div>
					</details>
				) : (
					<MessageBody
						message={message}
						messageType={messageType}
						messageLanguage={messageLanguage}
						style={style}
						chunking={chunking}
					/>
				)}
				<small
					className={`flex justify-end pt-1 ${incoming ? 'text-indigo-300' : isThought ? 'text-white' : 'text-gray-500 dark:text-white'}`}>
					{tokens > 0 && (
						<span className='me-1'>
							{tokens.toLocaleString()} token{tokens === 1 ? '' : 's'} -{' '}
						</span>
					)}
					<time
						className='cursor-pointer'
						title={today ? dateString : relativeDateString}
						dateTime={messageDate.toISOString()}>
						{today ? relativeDateString : dateString}
					</time>
				</small>
			</div>
		</div>
	);

	return (
		<>
			{authorNameSection}
			<div
				className={`grid grid-cols-1 xl:grid-cols-5 pb-2 ${incoming ? 'bg-gray-50 dark:bg-slate-900' : 'bg-gray-50 dark:bg-slate-900'} ${isFeedback && isLastMessage ? 'bg-yellow-50 dark:bg-slate-800' : ''} ${isLastSeen && !isLastMessage && !isFeedback ? 'border-b border-red-500' : ''}`}>
				<div className='invisible xl:visible col-span-1'></div>
				<div
					className={`flex ${incoming ? 'pe-2 justify-end' : 'ps-2 justify-start'} px-4 pt-1 col-span-1 xl:col-span-3`}>
					{!incoming && profilePicture}
					{messageBodySection}
					{incoming && profilePicture}
				</div>
				<div className='invisible xl:visible col-span-1'></div>
			</div>
		</>
	);
}

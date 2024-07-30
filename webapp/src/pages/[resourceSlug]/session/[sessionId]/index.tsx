import * as API from '@api';
import { StopIcon } from '@heroicons/react/24/outline';
import { Message } from 'components/chat/message';
import classNames from 'components/ClassNames';
import ConversationStarters from 'components/ConversationStarters';
import SessionChatbox from 'components/SessionChatbox';
import { useAccountContext } from 'context/account';
import { useChatContext } from 'context/chat';
import { useSocketContext } from 'context/socket';
import debug from 'debug';
import Head from 'next/head';
import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { SessionStatus } from 'struct/session';
const log = debug('webapp:socket');
import AgentAvatar from 'components/AgentAvatar';
import ContentLoader from 'react-content-loader';

export default function Session(props) {
	const scrollContainerRef = useRef(null);

	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [_chatContext, setChatContext]: any = useChatContext();
	const [lastSeenMessageId, setLastSeenMessageId] = useState(null);
	const [error, setError] = useState();
	// @ts-ignore
	const { sessionId } = router.query;
	const [currentSessionId, setCurrentSessionId] = useState(sessionId);
	const [session, setSession] = useState(null);
	const [app, setApp] = useState(null);
	const [authorAvatarMap, setAuthorAvatarMap] = useState({});

	const [loading, setLoading] = useState(false);
	const [showConversationStarters, setShowConversationStarters] = useState(true);
	const [socketContext]: any = useSocketContext();
	const [messages, setMessages] = useState([]);
	const [terminated, setTerminated] = useState(props?.session?.status === SessionStatus.TERMINATED);
	const [isAtBottom, setIsAtBottom] = useState(true);
	useEffect(() => {
		if (!scrollContainerRef || !scrollContainerRef.current) {
			return;
		}
		const handleScroll = e => {
			const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
			// Check if scrolled to the bottom
			const isCurrentlyAtBottom = scrollTop + clientHeight >= scrollHeight - 10;
			if (isCurrentlyAtBottom !== isAtBottom) {
				setIsAtBottom(isCurrentlyAtBottom);
				if (isCurrentlyAtBottom && messages?.length > 0) {
					setLastSeenMessageId(messages[messages.length - 1]._id);
				}
			}
		};
		const container = scrollContainerRef.current;
		container.addEventListener('scroll', handleScroll);
		// Cleanup
		return () => {
			container.removeEventListener('scroll', handleScroll);
		};
	}, [isAtBottom, scrollContainerRef?.current]);
	const sentLastMessage =
		!messages || (messages.length > 0 && messages[messages.length - 1].incoming);
	const lastMessageFeedback =
		!messages || (messages.length > 0 && messages[messages.length - 1].isFeedback);
	const chatBusyState = messages?.length === 0 || sentLastMessage || !lastMessageFeedback;

	async function joinSessionRoom() {
		socketContext.emit('join_room', sessionId);
	}
	async function leaveSessionRoom() {
		socketContext.emit('leave_room', sessionId);
	}
	function handleSocketMessage(message) {
		// console.log('Received chat message %O', JSON.stringify(message, null, 2));
		if (!message) {
			return;
		}
		if (isAtBottom && message?._id) {
			setLastSeenMessageId(message._id);
		}
		const newMessage = typeof message === 'string' ? { type: null, text: message } : message;
		setMessages(oldMessages => {
			// There are existing messages
			const matchingMessage = oldMessages.find(
				m =>
					m?.message?.chunkId != undefined &&
					m?.message?.chunkId === message?.message?.chunkId &&
					m?.authorName === message?.authorName
			);
			if (matchingMessage && message?.incoming !== true) {
				if (message?.message?.overwrite === true) {
					//TODO: revisit
					matchingMessage.message.text = message?.message?.text;
					matchingMessage.completed = true;
					return [...oldMessages];
				}
				const newChunk = {
					chunk: message.message.text,
					ts: message.ts,
					tokens: message?.message?.tokens
				};
				const newChunks = (
					matchingMessage?.chunks || [{ ts: 0, chunk: matchingMessage.message.text || '' }]
				)
					.concat([newChunk])
					.sort((ma, mb) => ma.ts - mb.ts);
				matchingMessage.chunks = newChunks;
				matchingMessage.message.text = newChunks.map(c => c.chunk).join('');
				return [...oldMessages];
			}
			return oldMessages
				.concat([newMessage])
				.map(mx => {
					if (mx.chunks) {
						mx.chunks = mx.chunks.sort((ma, mb) => ma.ts - mb.ts);
					}
					return mx;
				})
				.sort((ma, mb) => ma.ts - mb.ts);
		});
	}

	function scrollToBottom(behavior: string = 'instant') {
		//scroll to bottom when messages added (if currently at bottom)
		if (scrollContainerRef && scrollContainerRef.current && isAtBottom) {
			scrollContainerRef.current.scrollTo({
				left: 0,
				top: scrollContainerRef.current.scrollHeight,
				behavior
			});
		}
	}
	useEffect(() => {
		scrollToBottom();
		if (
			showConversationStarters &&
			messages.slice(0, 4).some(message => message.incoming === true)
		) {
			setShowConversationStarters(false);
		}
	}, [messages]);
	useEffect(() => {
		setShowConversationStarters(false);
	}, [sessionId]);

	function handleSocketJoined(joinMessage) {
		log('Received chat joined %s', joinMessage);
		updateChat();
		scrollToBottom('smooth');
	}
	function handleSocketStart() {
		socketContext.on('connect', joinSessionRoom);
		socketContext.on('reconnect', joinSessionRoom);
		socketContext.on('message', handleSocketMessage);
		socketContext.on('joined', handleSocketJoined);
		joinSessionRoom();
	}
	function handleSocketStop() {
		socketContext.off('connect', joinSessionRoom);
		socketContext.off('reconnect', joinSessionRoom);
		socketContext.off('message', handleSocketMessage);
		socketContext.off('joined', handleSocketJoined);
		leaveSessionRoom();
	}
	async function updateChat() {
		API.getSession(
			{
				resourceSlug,
				sessionId: router?.query?.sessionId
			},
			res => {
				setAuthorAvatarMap(res.avatarMap || {});
				setSession(res?.session || {});
				setApp(res?.app || {});
				setChatContext(res);
			},
			setError,
			router
		);
		API.getMessages(
			{
				resourceSlug,
				sessionId: router?.query?.sessionId
			},
			_messages => {
				const sortedMessages = _messages
					.map(m => {
						const _m = m.message;
						const combinedChunks = (m.chunks || [])
							.sort((ca, cb) => ca.ts - cb.ts)
							.map(x => x.chunk)
							.join('');
						if (m?.chunks?.length > 1 && combinedChunks?.length > 0) {
							_m.message.text =
								(_m.message.chunkId && _m.message.text.length > 0 ? _m.message.text : '') +
								combinedChunks;
						}
						_m.tokens = m.tokens || _m.tokens;
						_m._id = m._id; //id for last seen
						return _m;
					})
					.sort((ma, mb) => ma.ts - mb.ts);
				if (sortedMessages && sortedMessages.length > 0) {
					setLastSeenMessageId(sortedMessages[sortedMessages.length - 1]._id);
				}
				if (!sortedMessages.slice(0, 4).some(message => message.incoming === true)) {
					setShowConversationStarters(true);
				}
				setMessages(sortedMessages);
				setLoading(false);
				setTimeout(() => {
					scrollToBottom('smooth');
				}, 200);
			},
			setError,
			router
		);
	}
	useEffect(() => {
		leaveSessionRoom();
		handleSocketStart();
		return () => {
			handleSocketStop();
		};
	}, [resourceSlug, router?.query?.sessionId]);
	useEffect(() => {
		if (currentSessionId !== router?.query?.sessionId) {
			setMessages([]);
			setLoading(true);
			setCurrentSessionId(router?.query?.sessionId); //TODO: should this use a state ref and check the old vs .current state?
		}
	}, [router?.query?.sessionId]);

	function stopGenerating() {
		API.cancelSession(
			{
				_csrf: csrf,
				resourceSlug,
				sessionId: router?.query?.sessionId
			},
			() => {
				setTerminated(true);
				//generating stopped
			},
			setError,
			router
		);
	}

	function sendMessage(e, reset) {
		e.preventDefault && e.preventDefault();
		const message: string =
			typeof e === 'string' ? e : e.target.prompt ? e.target.prompt.value : e.target.value;
		if (!message || message.trim().length === 0) {
			return null;
		}
		socketContext.emit('message', {
			room: sessionId,
			authorName: account.name,
			message: {
				type: 'text',
				text: message
			}
		});
		reset && reset();
		return true;
	}

	return (
		<>
			<Head>
				<title>{`Session - ${sessionId}`}</title>
			</Head>
			<div
				className='flex flex-col -mx-3 sm:-mx-6 lg:-mx-8 -my-10 flex flex-col flex-1 align-center'
				style={{ maxHeight: 'calc(100vh - 110px)' }}
			>
				<div className='overflow-y-auto' ref={scrollContainerRef}>
					{messages &&
						messages.map((m, mi, marr) => {
							const authorName = m?.authorName || m?.message?.authorName;
							return (
								<Message
									key={`message_${mi}`}
									prevMessage={mi > 0 ? marr[mi - 1] : null}
									message={m?.message?.text}
									messageType={m?.message?.type}
									messageLanguage={m?.message?.language}
									authorName={m?.authorName}
									feedbackOptions={m?.options}
									incoming={m?.incoming}
									ts={m?.ts}
									isFeedback={m?.isFeedback}
									isLastMessage={mi === marr.length - 1}
									isLastSeen={false /*lastSeenMessageId && lastSeenMessageId === m?._id*/}
									displayType={m?.displayType || m?.message?.displayType}
									tokens={
										(m?.chunks
											? m.chunks.reduce((acc, c) => {
													return acc + (c.tokens || 0);
												}, 0)
											: 0) + (m?.tokens || m?.message?.tokens || 0)
									}
									chunking={m?.chunks?.length > 0}
									completed={m?.completed}
									agent={{ name: authorName, icon: { filename: authorAvatarMap[authorName] } }}
								/>
							);
						})}
					{((chatBusyState && messages?.length === 0 && !terminated) ||
						loading ||
						(messages && messages.length === 0)) && (
						<div className='text-center border-t pb-6 pt-8 dark:border-slate-600'>
							<span className='inline-block animate-bounce ad-100 h-4 w-2 mx-1 rounded-full bg-indigo-600 opacity-75'></span>
							<span className='inline-block animate-bounce ad-300 h-4 w-2 mx-1 rounded-full bg-indigo-600 opacity-75'></span>
							<span className='inline-block animate-bounce ad-500 h-4 w-2 mx-1 rounded-full bg-indigo-600 opacity-75'></span>
						</div>
					)}
				</div>
				{showConversationStarters && !chatBusyState && app?.chatAppConfig?.conversationStarters && (
					<div className='absolute left-1/2 bottom-1/2 transform -translate-x-1/2 -translate-y-1/2'>
						<ConversationStarters
							sendMessage={message => sendMessage(message, null)}
							conversationStarters={app?.chatAppConfig?.conversationStarters}
						/>
					</div>
				)}
				<div className='flex flex-col mt-auto pt-4 border-t'>
					<div className='flex flex-row justify-center'>
						<div className='flex items-start space-x-4 xl:basis-1/2 lg:basis-3/4 px-4 basis-full'>
							<div className='min-w-0 flex-1 h-full'>
								{messages ? (
									terminated ? (
										<p id='session-terminated' className='text-center h-full me-14 pt-3'>
											This session was terminated.
										</p>
									) : (
										<SessionChatbox
											app={app}
											scrollToBottom={scrollToBottom}
											lastMessageFeedback={lastMessageFeedback}
											chatBusyState={chatBusyState}
											stopGenerating={stopGenerating}
											onSubmit={sendMessage}
										/>
									)
								) : (
									<ContentLoader
										speed={2}
										width={'100%'}
										height={30}
										viewBox='0 0 100% 10'
										backgroundColor='#e5e5e5'
										foregroundColor='#ffffff'
									>
										<rect x='0' y='10' rx='5' width='100%' height='10' />
									</ContentLoader>
								)}
							</div>
						</div>
					</div>
				</div>
			</div>
		</>
	);
}

export async function getServerSideProps({
	req,
	res,
	query,
	resolvedUrl,
	locale,
	locales,
	defaultLocale
}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}

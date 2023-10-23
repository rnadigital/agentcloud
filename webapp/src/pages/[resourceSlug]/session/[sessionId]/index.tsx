import React, { useState, useEffect } from 'react';
// import { useParams } from 'next/navigation';
import Head from 'next/head';
import * as API from '../../../../api';
import { useAccountContext } from '../../../../context/account';
import { useSocketContext } from '../../../../context/socket';
import { useRouter } from 'next/router';
import { IncomingMessage, OutgoingMessage } from '../../../../components/chat/message';
import classNames from '../../../../components/ClassNames';
// import { toast } from 'react-toastify';

export default function Session(props) {

	const accountContext: any = useAccountContext();
	const { account, csrf } = accountContext as any;

	const router = useRouter();	
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();
	const { sessionId } = router.query;
	const { session } = state;

	const socketContext = useSocketContext();
	const [messages, setMessages] = useState(null);
	const [terminated, setTerminated] = useState(null);
	const sentLastMessage = !messages || (messages.length > 0 && messages[messages.length-1].incoming);
	async function joinSessionRoom() {
		socketContext.emit('join_room', sessionId);
	}
	function handleTerminateMessage(message) {
		console.log('Received terminate message', message);
		setTerminated(true);
		//TODO: set terminates state
	}
	function handleSocketMessage(message) {
		console.log(message);
		if (!message) {return;}
		const newMessage = typeof message === 'string'
			? { type: null, text: message }
			: message;
		setMessages(oldMessages => oldMessages.concat([newMessage]));
	}
	function scrollToBottom() {
		//scroll to bottom when messages added
		const messagesSection = document.getElementById('messages-section'); //TODO: should this be a ref?
		if (messagesSection) {
			setTimeout(() => {
				messagesSection.scrollTo({
					left: 0,
					top: messagesSection.scrollHeight,
					behavior: 'smooth',
				});
			}, 250);
		}
	}
	useEffect(() => {
		scrollToBottom();
	}, [messages]);
	function handleJoinedRoom() {
		if (messages.length === 0) {
			console.log(session);
			//if no messages found, session is new so submit the messages and one to task queue
			socketContext.emit('message', {
				room: sessionId,
				authorName: account.name,
				incoming: true,
				message: {
					type: 'text',
					text: session.prompt,
				}
			});
			socketContext.emit('message', {
				room: 'task_queue',
				event: session.type,
				message: {
					task: session.prompt,
					sessionId,
				},
			});
		}
		scrollToBottom();
	}
	function handleSocketStart() {
		socketContext.on('connect', joinSessionRoom);
		socketContext.on('terminate', handleTerminateMessage);
		// socketContext.on('reconnect', joinSessionRoom);
		socketContext.on('message', handleSocketMessage);
		socketContext.on('joined', handleJoinedRoom);
		socketContext.connected ? joinSessionRoom() : socketContext.connect();
	}
	function handleSocketStop() {
		socketContext.off('connect', joinSessionRoom);
		// socketContext.off('reconnect', joinSessionRoom);
		socketContext.off('terminate', handleTerminateMessage);
		socketContext.off('joined', handleJoinedRoom);
		socketContext.off('message', handleSocketMessage);
		// socketContext.connected && socketContext.disconnect();
	}
	useEffect(() => {
		if (!session) {
			//If no session, fetch it
			API.getSession({
				resourceSlug: account.currentTeam,
				sessionId,
			}, dispatch, setError, router);
		} else {
			setTerminated(session.status === 'terminated');
			//todo: move enums out of db file (to exclude backend mongo import stuff), then use in frontend)
		}
	}, [session]);
	useEffect(() => {
		if (messages == null) {
			//If no messages, fetch them (or empty array, is fine)
			API.getMessages({
				resourceSlug: account.currentTeam,
				sessionId,
			}, (_messages) => {
				setMessages(_messages.map(m => m.message));
			}, setError, router);
		}
	}, [messages]);
	useEffect(() => {
		//once we have the session and messages (or empty message array is fine), start
		if (session && messages != null) {
			handleSocketStart();
			return () => {
				//stop/disconnect on unmount
				handleSocketStop();
			};
		}
	}, [session, messages]);

	function sendMessage(e) {
		e.preventDefault();
		const message: string = e.target.prompt.value;
		if (!message || message.trim().length === 0) { return; }
		socketContext.emit('message', {
			room: sessionId,
			authorName: account.name,
			incoming: true,
			message: {
				type: 'text',
				text: message,
			}
		});
		e.target.reset();
	}

	if (!session) {
		return 'Loading...'; //TODO: loader
	}

	return (
		<>

			<Head>
				<title>Session - {sessionId}</title>
			</Head>

			{/*<div className='border-b pb-2 my-2 mb-6'>
				<h3 className='pl-2 font-semibold text-gray-900'>Session {sessionId}</h3>
			</div>*/}

			<div className='flex flex-col -m-7 -my-10 flex flex-col flex-1'>

            	<div className='overflow-y-auto' id='messages-section'>
					{messages && messages.map((m, mi) => {
						const MessageComponent = (m.incoming?IncomingMessage:OutgoingMessage);
						return <MessageComponent
							key={`message_${mi}`}
							message={m.message.text}
							messageType={m.message?.type}
							messageLanguage={m.message?.language}
							authorName={m.authorName}
						/>;
					})}
					{sentLastMessage && !terminated && <div className='text-center border-t pb-6 pt-8'>
						<span className='inline-block animate-bounce ad-100 h-4 w-2 mx-1 rounded-full bg-indigo-600 opacity-75'></span>
						<span className='inline-block animate-bounce ad-300 h-4 w-2 mx-1 rounded-full bg-indigo-600 opacity-75'></span>
						<span className='inline-block animate-bounce ad-500 h-4 w-2 mx-1 rounded-full bg-indigo-600 opacity-75'></span>
					</div>}
				</div>

				<div className='flex flex-row justify-center border-t p-4 mt-auto'>
					<div className='flex items-start space-x-4 basis-1/2'>
						<div className='flex-shrink-0  ring-1 rounded-full ring-gray-300'>
							<span
								className='inline-block h-10 w-10 text-center pt-2 font-bold'
							>
								{account.name.charAt(0).toUpperCase()}
							</span>
						</div>
						<div className='min-w-0 flex-1 h-full'>
							{terminated 
								? <p className='text-center h-full me-14 pt-3'>This session was terminated.</p>
								: <form action='/forms/session/add' className='relative' onSubmit={sendMessage}>
									<input type='hidden' name='_csrf' value={csrf} />
									<input type='hidden' name='type' value='generate_team' />
									<div className='overflow-hidden rounded-lg shadow-sm ring-1 ring-inset ring-gray-300 focus-within:ring-2 focus-within:ring-indigo-600'>
										<textarea
											rows={3}
											name='prompt'
											id='prompt'
											className='block w-full resize-none border-0 bg-transparent py-1.5 text-gray-900 placeholder:text-gray-400 focus:ring-0 sm:text-sm sm:leading-6'
											placeholder={'Type a message...'}
											defaultValue={''}
										/>
			
										{/* Spacer element to match the height of the toolbar */}
										<div className='py-2' aria-hidden='true'>
											{/* Matches height of button in toolbar (1px border + 36px content height) */}
											<div className='py-px'>
												<div className='h-9' />
											</div>
										</div>
									</div>
			
									<div className='absolute inset-x-0 bottom-0 flex justify-end py-2 pl-2 pr-2'>
										{/*<div className='flex items-center space-x-5'>
											<div className='flex items-center'>
												<button
													type='button'
													className='-m-2.5 flex h-10 w-10 items-center justify-center rounded-full text-gray-400 hover:text-gray-500'
												>
													<PaperClipIcon className='h-5 w-5' aria-hidden='true' />
													<span className='sr-only'>Attach a file</span>
												</button>
											</div>
										</div>*/}
										<div className='flex-shrink-0'>
											<button
												disabled={sentLastMessage}
												type='submit'
												className={classNames('inline-flex items-center rounded-md px-3 py-2 text-sm font-semibold text-white shadow-sm',
													!sentLastMessage
														? 'bg-indigo-600 hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
														: 'bg-indigo-400 cursor-wait')}
											>
												Send
											</button>
										</div>
									</div>
								</form>}
						</div>
					</div>
				</div>

			</div>

		</>
	);

};

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale }) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data }));
};

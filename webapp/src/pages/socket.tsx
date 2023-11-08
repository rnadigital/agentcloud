import React, { useState, useEffect, useContext } from 'react';
import Head from 'next/head';
import ErrorAlert from '../components/ErrorAlert';
import * as API from '../api';
import { useAccountContext } from '../context/account';
import { useRouter } from 'next/router';
import { useSocketContext } from '../context/socket';

export default function Socket(props) {

	const [accountContext]: any = useAccountContext();
	const { account, csrf, teamName } = accountContext as any;

	const router = useRouter();
	const [state, dispatch] = useState(props);
	const [error, setError] = useState();

	const socketContext = useSocketContext();	
	const [room, setRoom] = useState('');
	const [event, setEvent] = useState('');
	const [joinRoom, setJoinRoom] = useState('');
	const [message, setMessage] = useState('');
	const [roomList, setRoomList] = useState([]);
	const [socketResponse, setSocketResponse] = useState([]);
	const [socketReady, setSocketReady] = useState(false);
	async function joinTestRoom() {
		socketContext.emit('join_room', 'webapp');
	}
	function handleSocketMessage(message) {
		const newMessage = typeof message === 'string'
			? { type: null, text: message }
			: message;
		setSocketResponse(oldMessages => [newMessage].concat(oldMessages));
	}
	function handleSocketReady() {
		socketContext.connected ? joinTestRoom() : socketContext.connect();
		socketContext.on('connect', joinTestRoom);
		socketContext.on('message', handleSocketMessage);
		setSocketReady(true);
	}
	useEffect(() => {
		handleSocketReady();
		return () => {
			socketContext.off('connect', joinTestRoom);
			socketContext.off('message', handleSocketMessage);
		};
	}, []);

	useEffect(() => {
		if (!account) {
			API.getAccount(dispatch, setError, router);
		}
	}, []);
	
	if (!account) {
		return 'Loading...'; //TODO: loader
	}

	return (
		<>

			<Head>
				<title>Socket</title>
			</Head>

			{error && <ErrorAlert error={error} />}

			<div>Socket debugging</div>

			<div className='mt-6'>Join rooms</div>
			<div>
				<label htmlFor='room' className='block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5'>
					Room
				</label>
				<div className='mt-2 sm:col-span-2 sm:mt-0'>
					<input
						type='text'
						name='room'
						id='room'
						className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xl sm:text-sm sm:leading-6'
						onChange={(e) => setJoinRoom(e.target.value)} />
				</div>
			</div>
			<div className='mt-6 flex items-center justify-start gap-x-6'>
				<button
					onClick={() => {
						socketContext.emit('join_room', joinRoom);			
						setRoomList(oldRooms => oldRooms.concat([joinRoom]));
					}}
					type='submit'
					className='inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				>
					Join
				</button>
			</div>
			
			<pre className='mt-4'>
				Rooms joined: {JSON.stringify(roomList, null, 4)}
			</pre>
			
			<div className='mt-6'>Send messages</div>
			<div>
				<label htmlFor='room' className='block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5'>
					Room
				</label>
				<div className='mt-2 sm:col-span-2 sm:mt-0'>
					<input
						type='text'
						name='room'
						id='room'
						className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xl sm:text-sm sm:leading-6'
						onChange={(e) => setRoom(e.target.value)} />
				</div>
			</div>
			<div>
				<label htmlFor='room' className='block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5'>
					Event
				</label>
				<div className='mt-2 sm:col-span-2 sm:mt-0'>
					<input
						type='text'
						name='room'
						id='room'
						className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:max-w-xl sm:text-sm sm:leading-6'
						onChange={(e) => setEvent(e.target.value)} />
				</div>
			</div>
			<div>
				<label htmlFor='message' className='block text-sm font-medium leading-6 text-gray-900 sm:pt-1.5'>
					Message
				</label>
				<textarea
					onChange={(e) => setMessage(e.target.value)}
					rows={5}
					name='message'
					id='message'
					className='block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6'
					placeholder='Send a message...'
					defaultValue={''}
				/>
			</div>
			<div className='mt-6 flex items-center justify-start gap-x-6'>
				<button
					onClick={() => {
						socketContext.emit('message', { event, message, room });
					}}
					type='submit'
					className='inline-flex justify-center rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				>
					Send
				</button>
			</div>

			<pre className='mt-4'>
				Messages received: {JSON.stringify(socketResponse, null, 4)}
			</pre>

		</>
	);

}

export async function getServerSideProps({ req, res, query, resolvedUrl, locale, locales, defaultLocale}) {
	return JSON.parse(JSON.stringify({ props: res?.locals?.data || {} }));
}

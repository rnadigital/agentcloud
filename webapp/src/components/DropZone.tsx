import ButtonSpinner from 'components/ButtonSpinner';
import DatasourceChunkingForm from 'components/DatasourceChunkingForm';
import { useAccountContext } from 'context/account';
import getFileFormat from 'misc/getfileformat';
import { useRouter } from 'next/router';
import path from 'path';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';
import formatSize from 'utils/formatsize';

import * as API from '../api';

export default function DropZone({ children, setFiles, files, modelId, name, callback }:
	{ children: any, setFiles: any, files: any[], modelId: string, name: string, callback?: Function }) {

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const maxSize = 10*1024*1024;//10MB
	const [loading, setLoading] = useState(false);
	const [chunkStrategy, setChunkStrategy] = useState('semantic');
	const [chunkCharacter, setChunkCharacter] = useState('');

	const uploadFiles = async (e) => {
		e.preventDefault();
		try {
			setLoading(true);
			const formData = new FormData();
			formData.set('chunkStrategy', chunkStrategy as string);
			formData.set('chunkCharacter', chunkCharacter as string);
			formData.set('resourceSlug', resourceSlug as string);
			formData.set('modelId', modelId as string);
			formData.set('name', name as string);
			formData.set('_csrf', csrf as string);
			acceptedFiles.forEach(file => {
				formData.append('file', file);
			});
			await API.uploadDatasourceFileTemp(formData, (res) => {
				toast.success('Datasource created successfully');
				callback && callback();
			}, (res) => {
				toast.error(res);
			}, router);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const onDrop = useCallback(newAcceptedFiles => {
		setFiles(newAcceptedFiles);
	}, [files]);

	// @ts-ignore
	let { isDragActive, getRootProps, getInputProps, isDragReject, acceptedFiles, rejectedFiles } = useDropzone({
		onDrop,
		minSize: 0,
		maxSize,
	});

	const isFileTooLarge = rejectedFiles && rejectedFiles.length > 0 && rejectedFiles[0].size > maxSize;

	return (<span className='flex'>
		<form onSubmit={uploadFiles} className='w-full m-auto'>
			<ul>
				<label {...getRootProps({className: 'dropzone'})} htmlFor='file' className='block text-center border-2 border-dashed p-4 rounded'>
					<input id='file' {...getInputProps({ className: 'w-full h-full' })} />
					{!isDragActive && 'Click here or drop a file to upload'}
					{isDragActive && "Drop it like it's hot!"}
					<div className={`absolute bg-indigo-900/10 z-50 fixed w-screen h-screen top-0 left-0 border-dotted border-2 border-indigo-600 rounded-lg overflow-hidden transition-all duration-300 pointer-events-none ${isDragActive ? 'opacity-1' : 'opacity-0'}`} />
					{isDragReject && 'File type not accepted, sorry!'}
					{isFileTooLarge && (
						<div className='text-danger mt-2'>
				            File is too large.
						</div>
					)}
				</label>

				{files?.length > 0 && files.map((acceptedFile, ai) => (
					<li key={`acceptedFile_${ai}`} className='text-white bg-green-600 border-green-700 border rounded p-3 my-3'>
						{acceptedFile.name} ({formatSize(parseInt(acceptedFile.size))})
						<button
							type='button'
							onClick={() => {
								setFiles(null);
							}}
							className='float-right rounded-md disabled:bg-slate-400 bg-red-600 px-3 py-1 text-sm font-semibold text-white shadow-sm hover:bg-red-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-red-600 mt-0'
						>
							Remove
						</button>
					</li>
				))}

				{files?.length >0 && <>
					{children}
					<DatasourceChunkingForm
						chunkStrategy={chunkStrategy}
						setChunkStrategy={setChunkStrategy}
						chunkCharacter={chunkCharacter}
						setChunkCharacter={setChunkCharacter}
					/>
					<button
						disabled={loading || !files || !modelId || !chunkStrategy || (chunkStrategy === 'character' && chunkCharacter.length === 0)}
						type='submit'
						className='w-full rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600 mt-4'
					>
						{loading && <ButtonSpinner />}
						Upload
					</button>
				</>}
			</ul>
		</form>
	</span>);
}

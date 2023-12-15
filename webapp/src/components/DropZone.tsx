import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import * as API from '../api';
import { useRouter } from 'next/router';
import { useAccountContext } from 'context/account';
import ButtonSpinner from 'components/ButtonSpinner';
import { toast } from 'react-toastify';
import getFileFormat from 'misc/getfileformat';
import path from 'path';

export default function DropZone(props) {

	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext as any;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const maxSize = 10*1024*1024;//10MB
	const [loading, setLoading] = useState(false);

	const uploadFiles = async () => {
		try {
			setLoading(true);
			const formData = new FormData();
			formData.set('resourceSlug', resourceSlug as string);
			formData.set('_csrf', csrf as string);
			acceptedFiles.forEach(file => {
				formData.append('file', file);
			});
			console.log(formData);
			await API.uploadDatasourceFileTemp(formData, (res) => {
				toast.success('Datasource created successfully');
			}, (res) => {
				toast.error(res);
			}, router);
		} catch (e) {
			console.error(e);
		} finally {
			setLoading(false);
		}
	};

	const onDrop = useCallback(acceptedFiles => {
		console.log(acceptedFiles);
	}, []);

	// @ts-ignore
	const { isDragActive, getRootProps, getInputProps, isDragReject, acceptedFiles, rejectedFiles } = useDropzone({
		onDrop,
		minSize: 0,
		maxSize,
	});

	const isFileTooLarge = rejectedFiles && rejectedFiles.length > 0 && rejectedFiles[0].size > maxSize;
  
	return (<>
		<div className='text-center my-5 border-2 border-dashed p-4 rounded'>
			<div {...getRootProps()}>
				<input {...getInputProps()} />
				{!isDragActive && 'Click here or drop a file to upload!'}
				{isDragActive && !isDragReject && "Drop it like it's hot!"}
				{isDragReject && 'File type not accepted, sorry!'}
				{isFileTooLarge && (
					<div className='text-danger mt-2'>
			            File is too large.
					</div>
				)}
			</div>
		</div>

		<ul className='space-y-4'>
			{acceptedFiles.length > 0 && acceptedFiles.map((acceptedFile, ai) => (
				<li key={`acceptedFile_${ai}`} className='text-white bg-green-600 border-green-700 border rounded p-2'>
					{acceptedFile.name} ({getFileFormat(path.extname(acceptedFile.name)) || 'Unknown type'}, {acceptedFile.size} bytes)
				</li>
			))}
			<button
				onClick={uploadFiles}
				disabled={loading}
				type='submit'
				className='rounded-md bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
			>
				{loading && <ButtonSpinner />}
				Upload
			</button>
		</ul>
		
	</>);
}

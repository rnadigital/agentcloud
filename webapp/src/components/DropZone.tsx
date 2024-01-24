import ButtonSpinner from 'components/ButtonSpinner';
import { useAccountContext } from 'context/account';
import getFileFormat from 'misc/getfileformat';
import { useRouter } from 'next/router';
import path from 'path';
import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

import * as API from '../api';

export default function DropZone({ setFiles, files }) {

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
		<div className='w-full sm:w-1/2 m-auto'>
			<div className='text-center my-5 border-2 border-dashed p-4 rounded cursor-pointer'>
				<div {...getRootProps()}>
					<input {...getInputProps()} />
					{!isDragActive && 'Click here or drop a file to upload'}
					{isDragActive && !isDragReject && 'Drop it like its hot!'}
					{isDragReject && 'File type not accepted, sorry!'}
					{isFileTooLarge && (
						<div className='text-danger mt-2'>
				            File is too large.
						</div>
					)}
				</div>
			</div>

			<ul className='space-y-4'>
				{files?.length > 0 && files.map((acceptedFile, ai) => (
					<li key={`acceptedFile_${ai}`} className='text-white bg-green-600 border-green-700 border rounded p-2'>
						{acceptedFile.name} ({getFileFormat(path.extname(acceptedFile.name)) || 'Unknown type'}, {acceptedFile.size} bytes)
						<button
							type='button'
							onClick={() => {
								setFiles(null);
							}}
							className='text-red-500 hover:text-red-700'
						>
							Remove
						</button>
					</li>
				))}
				<button
					onClick={uploadFiles}
					disabled={loading || !files}
					type='submit'
					className='w-full rounded-md disabled:bg-slate-400 bg-indigo-600 px-3 py-2 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600'
				>
					{loading && <ButtonSpinner />}
					Upload
				</button>
			</ul>
		</div>
	</span>);
}

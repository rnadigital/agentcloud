import * as API from '@api';
import { Dialog, Transition } from '@headlessui/react';
import { CameraIcon } from '@heroicons/react/24/outline';
import AgentAvatar from 'components/AgentAvatar';
import ButtonSpinner from 'components/ButtonSpinner';
import ErrorAlert from 'components/ErrorAlert';
import { useAccountContext } from 'context/account';
import { useRouter } from 'next/router';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { toast } from 'react-toastify';

export default function AvatarUploader({
	callback,
	existingAvatar,
	isDialogOpen,
	setIsDialogOpen
}) {
	// add isOpen prop
	const [files, setFiles] = useState([]);
	const [uploading, setUploading] = useState(false);
	const [error, setError] = useState(null);
	const [accountContext]: any = useAccountContext();
	const { account, csrf } = accountContext as any;
	const router = useRouter();
	const resourceSlug = router?.query?.resourceSlug || account?.currentTeam;
	const maxSize = 10 * 1024 * 1024; // 10MB

	const onDrop = useCallback(acceptedFiles => {
		setFiles(
			acceptedFiles.map(file =>
				Object.assign(file, {
					preview: URL.createObjectURL(file)
				})
			)
		);
	}, []);

	// @ts-ignore
	let { isDragActive, getRootProps, getInputProps, acceptedFiles, rejectedFiles } = useDropzone({
		onDrop,
		minSize: 0,
		maxSize,
		accept: { 'image/*': [] }
	});

	useEffect(() => {
		if (!acceptedFiles || acceptedFiles?.length === 0) {
			return;
		}
		uploadIcon();
	}, [acceptedFiles]);

	useEffect(() => {
		return () => files.forEach(file => URL.revokeObjectURL(file.preview));
	}, [files]);

	useEffect(() => {
		if (!isDialogOpen) {
			setFiles([]);
			files.forEach(file => URL.revokeObjectURL(file.preview));
		}
	}, [isDialogOpen]);

	const uploadIcon = async () => {
		if (files.length === 0) {
			toast.error('Please select a file to upload.');
			return;
		}

		setUploading(true);
		const formData = new FormData();
		formData.append('file', files[0]);
		formData.append('resourceSlug', resourceSlug);
		formData.append('_csrf', csrf);

		try {
			await API.addAsset(
				formData,
				response => {
					if (response && response._id) {
						// toast.success('Uploaded successfully.');
						callback(response);
					} else {
						toast.error('Failed to upload.');
					}
				},
				setError,
				router
			);
		} catch (error) {
			console.error(error);
			toast.error('An error occurred while uploading.');
		} finally {
			setUploading(false);
		}
	};

	if (!process.env.NEXT_PUBLIC_STORAGE_PROVIDER) {
		return (
			<ErrorAlert
				error={`Avatar uploader disabled because NEXT_PUBLIC_STORAGE_PROVIDER is: "${process.env.NEXT_PUBLIC_STORAGE_PROVIDER}"`}
			/>
		);
	}

	return (
		<>
			{error && <ErrorAlert error={error} />}
			<div className='w-24 h-24 rounded-full overflow-hidden border-2 border-dashed'>
				<label
					{...getRootProps({ className: 'dropzone', onClick: e => e.stopPropagation() })}
					htmlFor='file'
					className='block text-center h-full cursor-pointer'
				>
					<input id='file' {...getInputProps({ className: 'w-full h-full' })} />
					{isDragActive ? (
						<p>Drop the icon here ...</p>
					) : uploading ? (
						<ButtonSpinner className='ms-1 mt-9' size={20} />
					) : files?.length > 0 ? (
						<img
							src={files[0].preview}
							className='h-full w-full object-cover'
							alt='Avatar preview'
						/>
					) : files?.length === 0 ? (
						<CameraIcon className='h-full transition-all hover:stroke-gray-600 stroke-gray-400 w-8 inline-flex align-center justify-center' />
					) : (
						<AgentAvatar agent={{ icon: existingAvatar }} fill={true} />
					)}
				</label>
			</div>
		</>
	);
}

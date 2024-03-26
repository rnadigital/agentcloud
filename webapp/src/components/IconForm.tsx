import { addIcon } from '@api';
import { useRouter } from 'next/router';
import React, { useState } from 'react';
import { toast } from 'react-toastify';

export default function IconForm ({ onIconUpload }) {

	const router = useRouter();
	const [file, setFile] = useState(null);
	const [loading, setLoading] = useState(false);

	const handleFileChange = (event) => {
		setFile(event.target.files[0]);
	};

	const handleSubmit = async (event) => {
		event.preventDefault();
		if (!file) {
			toast.error('Please select a file to upload.');
			return;
		}
		const formData = new FormData();
		formData.append('file', file);
		setLoading(true);
		try {
			await addIcon(formData, (response) => {
				toast.success('Icon uploaded successfully.');
				onIconUpload(response.iconId); // Make sure your backend returns the iconId or adjust according to your return structure
			}, (error) => {
				toast.error('Failed to upload icon: ' + error);
			}, router);
		} finally {
			setLoading(false);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<input 
				type='file' 
				onChange={handleFileChange}
				disabled={loading}
			/>
			<button type='submit' disabled={loading || !file}>
				{loading ? 'Uploading...' : 'Upload Icon'}
			</button>
		</form>
	);
}

import CopyToClipboardInput from 'components/CopyToClipboardInput';
import InfoAlert from 'components/InfoAlert';
import { useRouter } from 'next/router';
import React from 'react';

const SharingModeInfoAlert = ({ app }) => {
	const origin = typeof location !== 'undefined' ? location.origin : '';
	const router = useRouter();
	const { resourceSlug } = router.query;

	return (
		<InfoAlert
			textColor='black'
			className='rounded bg-yellow-200 p-4 -mt-3 sm:col-span-12'
			message='Public apps can be accessed by anyone, potentially incurring token costs.'
		>
			<CopyToClipboardInput dataToCopy={`${origin}/s/${resourceSlug}/app/${app._id}`} />
		</InfoAlert>
	);
};

export default SharingModeInfoAlert;

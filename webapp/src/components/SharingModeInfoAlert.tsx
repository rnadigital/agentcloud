import CopyToClipboardInput from 'components/CopyToClipboardInput';
import InfoAlert from 'components/InfoAlert';
import { useRouter } from 'next/router';
import React from 'react';

export default function SharingModeInfoAlert({
	shareLinkShareId,
	message = 'Public apps can be accessed by anyone, potentially incurring token costs.',
	classNames = 'rounded bg-yellow-200 p-4 -mt-3 sm:col-span-12'
}) {
	const origin = typeof location !== 'undefined' ? location.origin : '';
	const router = useRouter();
	const { resourceSlug } = router.query;
	return (
		<InfoAlert textColor='black' className={classNames} message={message}>
			<CopyToClipboardInput dataToCopy={`${origin}/s/${resourceSlug}/${shareLinkShareId}`} />
		</InfoAlert>
	);
}

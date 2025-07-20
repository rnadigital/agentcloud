import { useState } from 'react';
import { useRouter } from 'next/router';
import { useAccountContext } from 'context/account';
import { toast } from 'react-toastify';
import * as API from '@api';
import ToolForm from 'components/tools/ToolForm';
import { ToolType } from 'struct/tool';

export function Custom({ fetchTools, setDisplayScreen, setActiveTab }) {
	const [accountContext]: any = useAccountContext();
	const { csrf } = accountContext;
	const router = useRouter();
	const { resourceSlug } = router.query;
	const [submitting, setSubmitting] = useState(false);

	return (
		<div className='flex flex-col gap-4'>
			<h2 className='text-xl font-semibold'>Create Custom Tool</h2>
			<ToolForm
				setActiveTab={setActiveTab}
				editing={false}
				initialType={ToolType.FUNCTION_TOOL}
				compact={false}
				fetchTools={fetchTools}
				setDisplayScreen={setDisplayScreen}
			/>
		</div>
	);
}

import { ClipboardDocumentIcon } from '@heroicons/react/24/outline';
import { useDeveloperContext } from 'context/developer';
import { toast } from 'react-toastify';

interface DevBadgeProps {
	label?: string;
	value: string;
}

export default function DevBadge({ label = 'ID', value }: DevBadgeProps) {
	const { developerMode } = useDeveloperContext();
	if (!developerMode) {
		return null;
	}
	return (
		<span
			onClick={async e => {
				e.preventDefault();
				e.stopPropagation();
				await navigator.clipboard.writeText(value);
				toast.success('Copied to clipboard');
				return false;
			}}
			className='hover:bg-blue-200 transition-all cursor-pointer whitespace-nowrap h-6 px-2 py-[0.5px] border text-sm rounded-lg bg-blue-100 text-blue-800 border-blue-300'
		>
			{label}: {value}
			<ClipboardDocumentIcon aria-hidden='true' className='inline ms-1 -mt-1 h-4 w-4' />
		</span>
	);
}

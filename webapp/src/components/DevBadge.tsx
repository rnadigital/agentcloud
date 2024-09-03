import { useDeveloperContext } from 'context/developer';

interface DevBadgeProps {
	text: string;
}

export default function DevBadge({ text }: DevBadgeProps) {
	const { developerMode } = useDeveloperContext();
	if (!developerMode) {
		return null;
	}
	return (
		<span className='whitespace-nowrap h-6 px-2 py-[0.5px] border text-sm rounded-lg bg-blue-100 text-blue-800 border-blue-300'>
			{text}
		</span>
	);
}

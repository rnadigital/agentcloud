import { CircleStackIcon, CodeBracketIcon } from '@heroicons/react/20/solid';
import { ToolType } from 'struct/tool';

const ToolSelectIcons = {
	[ToolType.FUNCTION_TOOL]: <CodeBracketIcon className='h-4 w-4 text-blue-500' />,
	[ToolType.RAG_TOOL]: <CircleStackIcon className='h-4 w-4 text-orange-500' />
};

export default ToolSelectIcons;
